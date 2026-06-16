---
title: "Refactorizando de Bash a Python para un CTF de Linux"
description: "Cómo un capítulo de Effective Python se convirtió en una refactorización real de la configuración del CTF de Linux de Learn to Cloud."
pubDate: 2026-05-27
tags: ["python", "learntocloud"]
lang: "es"
translationKey: "refactoring-bash-to-python-for-a-linux-ctf"
---

He estado estudiando un montón de temas sueltos de Python últimamente. Uno de mis libros favoritos es [*Effective Python*](https://effectivepython.com/), porque está estructurado de una forma en la que puedes leer 1 ítem y aplicarlo de inmediato. Anoche (me encanta estudiar de madrugada, por eso el [issue](https://github.com/learntocloud/linux-ctfs/issues/81) que dio inicio a este trabajo se creó a las 12:00 AM).

Me metí con el capítulo 9, ítem 67: "Usa `subprocess` para gestionar procesos hijos". El módulo [`subprocess`](https://docs.python.org/3/library/subprocess.html) básicamente te deja correr comandos de tu sistema desde Python. Sabía exactamente dónde quería aplicar lo que aprendí.

Por suerte mantengo [Learn to Cloud](https://learntocloud.guide), que incluye un [CTF de Linux](https://github.com/learntocloud/linux-ctfs) que antes usaba mucho Bash. Es un laboratorio para gente que está aprendiendo la línea de comandos de Linux. Despliegas una VM en AWS, Azure o GCP, te conectas por SSH y resuelves dieciocho retos con herramientas de terminal. La experiencia para quien aprende es intencionalmente simple.


## El problema

Creamos la primera versión del laboratorio hace más de un año. La configuración era un único script de Bash monolítico: `ctf_setup.sh`. Instalaba paquetes, configuraba SSH, creaba usuarios, generaba flags, escribía los archivos de los retos, creaba servicios, manejaba el estado y escribía el MOTD.


Después agregamos el comando `verify`, que le da a quien aprende una forma de revisar su progreso, listar los retos disponibles, pedir pistas, consultar el tiempo y más. Era una interfaz de línea de comandos completa, de unas 70 líneas, incrustada dentro del mismo script de Bash.

Bash es fantástico, pero habíamos hecho crecer el script hasta el punto de obligarlo a cargar con demasiadas responsabilidades. Si queríamos que el código fuera más mantenible y escalable, teníamos que refactorizarlo.

## Entender a fondo primero

Con el uso cada vez mayor de la IA en la programación, me parece cada vez más importante obligarme a bajar el ritmo y entender a fondo un problema antes de saltar a una solución.

Empecé analizando el código actual para entender todas las responsabilidades que cargaba el script de Bash. Terminé armando un desglose de lo que hacía el script.

| Área | Responsabilidad |
| --- | --- |
| Flags | Generación de flags y hashing HMAC-SHA256 por reto |
| Verificación | Generación de tokens de verificación |
| Configuración del sistema | Instalación de paquetes, configuración de SSH, sysctl y DNS |
| Usuarios | Gestión de usuarios para `ctf_user`, `flag_user` y `old_admin` |
| Estado | Almacenamiento del estado del CTF |
| CLI | El comando `verify` incrustado, que eran más de 350 líneas de Bash dentro de un heredoc |
| Flujo de bienvenida | MOTD y mensaje de bienvenida |
| Preparación | Script que verifica que la configuración esté lista |
| Retos | 18 entornos de retos individuales |
| Finalización | Generación del certificado de finalización |
| Idempotencia | Marcador de finalización de la configuración |

## Categorizar las responsabilidades

Como dije antes, Bash tiene sus fortalezas y debilidades, igual que Python. La clave es usar la herramienta correcta para cada trabajo. Así que esta fue una oportunidad para revisar las responsabilidades y decidir la mejor forma de repartirlas, porque algunas las podía manejar mejor Python, mientras que otras le quedan mejor al shell.

Clasifiqué cada responsabilidad en uno de tres grupos:

| Categoría | Responsabilidades |
| --- | --- |
| Solo Python | Generación y hashing de flags, tokens de verificación, almacenamiento del estado del CTF, MOTD, verificación de que la configuración esté lista, CLI `verify`, retos 1, 2, 3, 5, 7, 8, 9, 13, 15, 16 y marcador de finalización |
| Solo subprocess | Instalación de paquetes, gestión de usuarios para `ctf_user`, `flag_user` y `old_admin`, y los comandos de sistema de archivos del reto 18 |
| Mixto | Configuración del SO y de SSH, retos 4, 6, 10, 11, 12, 14 y 17 |

---

## Configuración en el primer arranque

Otra cosa que tenía en mente al entrar en esta refactorización era darle un rol más limpio a la configuración del primer arranque. Ya la estábamos usando. En AWS y Azure eso es cloud-init leyendo el user data o el custom data; en GCP es el runner del startup-script. Pero la habíamos tratado como un lugar para tirar toda la configuración del CTF.

En mi cabeza, para este laboratorio, el primer arranque debería hacer una sola cosa: llevar la VM a un estado donde la configuración real pueda tomar el control. Instalar un par de prerrequisitos y después ceder el paso. La configuración del CTF en sí (paquetes, usuarios, flags, retos, servicios, MOTD) no debería vivir dentro del boot data. Debería ser algo a lo que el primer arranque llame.

## La implementación

En el [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) hicimos el trabajo.

1. Convertí `ctf_setup.sh` en un bootstrap delgado. Activa el modo estricto del shell, revisa un marcador de idempotencia en el directorio de estado por instancia de cloud-init, instala `uv` para que la VM no dependa del Python del sistema, corre la configuración en Python, instala la CLI `verify`, y solo escribe el marcador de éxito si la configuración realmente terminó.
2. Moví la configuración real a un paquete de Python `setup/`, dividido por responsabilidad: orquestación, generación de flags, configuración del sistema, estado, helpers compartidos para `subprocess` y systemd, y un archivo por reto.
3. Moví el comando `verify`, el que usa quien aprende, a su propio paquete `verify/` con `argparse`, `rich` y `pyfiglet`. Eso eliminó el heredoc de Bash de 350 líneas y las dependencias `figlet` / `lolcat`.

La refactorización también me dio la oportunidad de revisar cada reto. Cada uno se movió a su propio archivo dentro de `setup/challenges/`, lo que hizo mucho más fácil leer lo que un reto hace en realidad sin tener que pasar por encima de otros diecisiete. La mayoría fueron adaptaciones directas del Bash que ya existía. Algunos sí valían una segunda mirada:

- **Reto 9 (DNS)** antes modificaba `/etc/resolv.conf`. En las imágenes de nube de Ubuntu ese archivo lo controla `systemd-resolved`, y sobrescribirlo es pelearse con la plataforma. La nueva versión deja un archivo de configuración en `/etc/systemd/resolved.conf.d/` y manda a quien aprende a usar `resolvectl` en su lugar.
- **Reto 18 (sistemas de archivos)** lo dejé basado en shell a propósito. `mkfs.ext4`, `mount` y `umount` no tienen un equivalente limpio en la biblioteca estándar, así que Python solo los orquesta a través de `subprocess`.
- **Los retos de gestión de usuarios** (alrededor de `ctf_user`, `flag_user` y `old_admin`) siguieron llamando a `useradd`, `chpasswd` y `usermod` por la misma razón.

Aquí es donde `subprocess` brilla. Python pasó a ser el proceso padre. Maneja la estructura, las rutas, el estado, los archivos y la orquestación de comandos. Los comandos de Linux siguen haciendo el trabajo de Linux, porque no hay un reemplazo limpio en la biblioteca estándar. Un pequeño helper `run()` en `helpers.py` es el puente:

---

## Lo que el testing dejó al descubierto

Después probé la nueva implementación. Como en toda refactorización, nada sale perfecto al primer intento.

Lo primero que se me había olvidado era cómo llegaba el laboratorio a la VM en realidad. El código de Terraform anterior simplemente descargaba un único `ctf_setup.sh` desde GitHub y se lo entregaba al primer arranque. Eso funcionaba cuando la configuración era un solo archivo. Después de la refactorización, la VM necesitaba `ctf_setup.sh`, `setup/` y `verify/` juntos, y ya no había un único archivo para descargar.

Así que cuando desplegué la nueva configuración, todavía estaba cargando el viejo `ctf_setup.sh`. Eso llevó al siguiente problema: ¿cómo hacemos que los directorios `setup/` y `verify/` estén disponibles en la VM?

El script de bootstrap delgado cabe sin problema en el boot data. El paquete no. El boot data nunca se pensó para transportar un paquete, y en AWS ni siquiera cabría (el user data tiene un límite de 16 KB antes de codificar en base64). Así que el bootstrap tenía que quedarse en el boot data, y el paquete tenía que llegar a la VM de otra forma.

Después de investigar un poco, también consideré meter todo en una imagen de VM personalizada por proveedor, para que el primer arranque casi no tuviera nada que hacer. Anoté esa idea como uno de los enfoques en el [issue #83](https://github.com/learntocloud/linux-ctfs/issues/83) para revisarla más adelante. Por ahora era demasiado trabajo para una refactorización que ya estaba tocando suficientes cosas, y siempre podemos iterar después. Así que fuimos por el arreglo más simple a corto plazo: dos modos, controlados por una variable de Terraform (`use_local_setup`).

1. **Modo release** despliega desde un release versionado de GitHub. Un workflow de GitHub Actions (`.github/workflows/release-setup.yml`) construye un `linux-ctfs-setup.tar.gz` más un checksum sha256 en cada release etiquetado. Después Terraform inyecta un pequeño bootstrap inline en el boot data de la nube (user data en AWS, custom data en Azure, startup script en GCP). Ese script inline no es `ctf_setup.sh`. Su único trabajo es descargar el tarball del `setup_release_tag` fijado, verificar el checksum, descomprimirlo y luego correr el `ctf_setup.sh` que vive dentro del tarball. Esto lo mantiene simple para quien aprende, porque lo único que tiene que hacer es `terraform init` y `terraform apply`. No necesita que exista nada local en su máquina más allá de la configuración de Terraform, pero el repo igual contiene todo el código, así que también es una oportunidad de aprendizaje si quiere explorar la base de código.
2. **Modo colaborador** despliega completamente desde archivos locales. Terraform sube los `ctf_setup.sh`, `setup/` y `verify/` locales por SSH después de que la VM arranca, así se pueden probar cambios sin mergear antes de que exista un release. Es ideal para quien contribuye al laboratorio. Se activa de forma opcional con la variable `use_local_setup = true`.

Trabajar con releases también nos dio un artefacto real al que apuntar. Cada actualización del laboratorio ahora es un release etiquetado, y quienes aprenden y contribuyen pueden leer las notas del release para entender qué cambió. Ya no hay que escarbar entre commits o PRs para descubrir qué hay en una versión dada del laboratorio.

---

## Preparación

Después de que se mergeó el [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89), saqué [`v0.1.0`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.0) y probé la ruta de release en Azure. El tarball se descargó, se verificó, se descomprimió y se corrió sin problemas. Pero la experiencia de quien aprende todavía tenía un detalle molesto: Terraform imprimía la IP de la VM apenas el proveedor de nube consideraba creada la VM, lo cual pasaba bastante antes de que `ctf_setup.sh` hubiera terminado de verdad. Alguien podía conectarse por SSH demasiado pronto y encontrarse con el MOTD ausente, los servicios sin correr y los archivos de los retos todavía sin escribir.

El arreglo limpio es nativo de cada proveedor: la Custom Script Extension de VM en Azure, AWS SSM Run Command, algo equivalente en GCP. Cada uno tiene un costo real en permisos e infraestructura, y los tres proveedores no se comportan igual. Abrí el [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) para diseñar eso bien más adelante.

Para el arreglo inmediato, el [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) agregó una espera de preparación que funciona en los tres proveedores. La configuración en Python escribe un marcador de éxito cuando termina y un marcador de fallo si truena. Terraform consulta esos marcadores por SSH y solo devuelve los datos de conexión de la VM una vez que existe el marcador de éxito. Si aparece el marcador de fallo, falla de una vez en lugar de fingir que el laboratorio está listo.

Después saqué [`v0.1.1`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1) y volví a probar. SSH esperó hasta que el laboratorio estuvo realmente listo, el MOTD apareció y los retos estaban en su lugar.

También recorrí cada reto a mano en la VM en vivo, capturé cada flag y confirmé que los dieciocho funcionaban de principio a fin. Una gran oportunidad para validar al 100% y sacarle el óxido a mis habilidades de bash.

---

## El testing como algo de primera clase

Las pruebas manuales hicieron su trabajo, pero también me mostraron dónde la propia configuración de pruebas estaba floja. De ahí salieron tres cosas.

### Una skill de testing del CTF más limpia

`.github/skills/ctf-testing/SKILL.md` eran las instrucciones para el agente sobre cómo probar el laboratorio. Con el tiempo se había desviado y ya no era el primer lugar al que mandaría a un agente que quisiera probar un cambio.

La rehíce hasta dejarla en dos modos:

- **Prueba básica**: desplegar en un proveedor y correr toda la suite de retos, sin reinicio.
- **Prueba completa**: lo mismo, más una pasada de validación con reinicio para asegurar que los marcadores de configuración, las unidades de systemd y la persistencia sobreviven a un reinicio.

Las frases que la activan ahora son aburridas y obvias, como `Run a basic test on Azure` o `Run a full test on all providers`. La skill mantiene en un solo lugar el modo, la elección de proveedor, el comando, qué se valida, qué se espera de la limpieza y cómo se reportan los resultados. La probé de principio a fin en Azure con `Run a basic test on Azure, the az cli is authenticated, use that subscription` y desplegó, validó los dieciocho retos, exportó el certificado, revisó los tokens y el comportamiento de congelación del tiempo, y después limpió nueve recursos de Terraform sin dejar nada atrás.

### Un CONTRIBUTING.md más liviano

También recorté `CONTRIBUTING.md` a lo que de verdad necesita quien contribuye: los chequeos locales, los comandos de prueba en la nube básica y completa, cómo se comporta el modo colaborador y notas cortas de troubleshooting. Menos texto, más "aquí está el comando, esto es lo que hace".

### El script de orquestación es lo que sigue

El script local que realmente corre las pruebas en la nube sigue siendo Bash, y acumuló un montón de estado. Maneja las llamadas a Terraform, los valores específicos de cada proveedor, SSH y SCP, los reintentos, los timeouts, los chequeos de marcadores de configuración, el flujo de reinicio, la limpieza y el reporte final. Es demasiada ramificación para un script de shell.

El plan, registrado en el [issue #88](https://github.com/learntocloud/linux-ctfs/issues/88), es mantener en shell el script de validación del lado de la VM (porque esa parte literalmente está ejercitando la experiencia de línea de comandos de quien aprende) y reescribir en Python el script de orquestación local, para que los timeouts, la limpieza y el reporte de fallos dejen de estar sostenidos con `trap` y `set -e`. La estructura de la suite de pruebas en sí se registra aparte en el [issue #85](https://github.com/learntocloud/linux-ctfs/issues/85), con ideas como flags `--challenge 10` y `--smoke` para no tener que correr los dieciocho retos cada vez que quiero validar un arreglo de una línea.

---

## Qué significa esto para quienes aprenden y contribuyen

A quien aprende no le importa que la configuración ahora sea Python, y la mayor parte de la experiencia ya existía antes de esta refactorización. Las ganancias que de verdad reciben son una configuración un poco más rápida en la ruta de release probada en Azure, y notas de release que sirven al mismo tiempo como notas de actualización del laboratorio, para que tengan un lugar claro donde ver qué cambió.

Para quienes contribuyen, las ganancias son más inmediatas:

- El código de configuración está dividido por responsabilidad, en lugar de vivir en un solo archivo gigante de Bash.
- El comando `verify` es un paquete de Python en lugar de un heredoc incrustado.
- El código de los retos es más fácil de encontrar, revisar y cambiar.
- El modo release usa assets de configuración versionados con checksums; el modo colaborador todavía permite probar localmente cambios sin mergear.
- El trabajo de preparación a más largo plazo se registra en el [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) en lugar de quedar enterrado dentro de la refactorización.

Ahora quien contribuye puede cambiar un reto, probarlo localmente con el modo colaborador, abrir un PR, mergearlo, publicar un release y dejar que quienes aprenden desplieguen ese release.

---

## Lo que aprendí

La refactorización empezó porque quería practicar una idea de un libro. Terminó tocando el empaquetado de releases, cloud-init, el comportamiento de Terraform, los límites del boot data del primer arranque, las pruebas de quienes contribuyen, la documentación para quien aprende y la validación manual. Así suelen ser las refactorizaciones útiles. Rara vez se tratan solo de la forma del código.

Bash sigue siendo la herramienta correcta para hacer el bootstrap de una VM. Python es la mejor herramienta cuando ese bootstrap se convierte en una aplicación. `subprocess` es el puente entre esos dos trabajos.

Y gracias a las pruebas manuales, pude practicar mis habilidades de shell.
