---
title: "Refactorizando de Bash a Python para un CTF de Linux"
description: "Cómo un capítulo de Effective Python se convirtió en una refactorización real de la configuración del CTF de Linux de Learn to Cloud."
pubDate: 2026-05-27
tags: ["python", "learntocloud"]
lang: "es"
translationKey: "refactoring-bash-to-python-for-a-linux-ctf"
---

He estado estudiando muchos temas variados de Python últimamente. Uno de mis libros favoritos es [*Effective Python*](https://effectivepython.com/), porque está estructurado de una forma en la que puedes leer 1 ítem y aplicarlo de inmediato. Anoche (me encanta estudiar de madrugada, por eso el [issue](https://github.com/learntocloud/linux-ctfs/issues/81) que dio inicio a este trabajo se creó a las 12:00 AM).

Abordé el capítulo 9, ítem 67: «Usa `subprocess` para gestionar procesos hijos». El módulo [`subprocess`](https://docs.python.org/3/library/subprocess.html) básicamente te permite ejecutar comandos en tu sistema desde dentro de Python. Sabía exactamente dónde quería aplicar lo aprendido.

Por suerte mantengo [Learn to Cloud](https://learntocloud.guide), que incluye un [CTF de Linux](https://github.com/learntocloud/linux-ctfs) que solía usar mucho Bash. Es un laboratorio para personas que están aprendiendo la línea de comandos de Linux. Despliegas una VM en AWS, Azure o GCP, te conectas por SSH y resuelves dieciocho retos con herramientas de terminal. La experiencia de aprendizaje es intencionalmente simple.


## El problema

Creamos la primera versión del laboratorio hace más de un año. La configuración era un único script de Bash monolítico: `ctf_setup.sh`. Instalaba paquetes, configuraba SSH, creaba usuarios, generaba banderas, escribía archivos de retos, creaba servicios, gestionaba el estado y escribía el MOTD.


Más tarde agregamos el comando `verify`, que les da a quienes aprenden una forma de revisar su progreso, listar los retos disponibles, obtener pistas, consultar el tiempo y más. Era una interfaz de línea de comandos completa de alrededor de 70 líneas incrustada dentro del mismo script de Bash.

Bash es fantástico, pero habíamos hecho crecer el script hasta el punto de obligarlo a manejar demasiadas responsabilidades. Si queríamos que el código fuera más mantenible y escalable, necesitábamos refactorizarlo.

## Entender a fondo primero

Con el uso cada vez mayor de la IA en la programación, me parece cada vez más importante obligarme a ir más despacio y entender a fondo un problema antes de saltar a una solución.

Empecé analizando el código actual para entender todas las responsabilidades que manejaba el script de Bash. Terminé creando un desglose de la funcionalidad del script.

| Área | Responsabilidad |
| --- | --- |
| Banderas | Generación de banderas y hash HMAC-SHA256 por reto |
| Verificación | Generación de tokens de verificación |
| Configuración del sistema | Instalación de paquetes, configuración de SSH, sysctl y DNS |
| Usuarios | Gestión de usuarios para `ctf_user`, `flag_user` y `old_admin` |
| Estado | Almacenamiento del estado del CTF |
| CLI | El comando `verify` incrustado, que eran más de 350 líneas de Bash dentro de un heredoc |
| Flujo de bienvenida | MOTD y mensaje de bienvenida |
| Preparación | Script de verificación de preparación de la configuración |
| Retos | 18 entornos de retos individuales |
| Finalización | Generación del certificado de finalización |
| Idempotencia | Marcador de finalización de la configuración |

## Categorizar las responsabilidades

Como dije antes, Bash tiene sus fortalezas y debilidades, igual que Python. La clave es usar la herramienta correcta para el trabajo correcto. Así que esta fue una oportunidad para revisar las responsabilidades y determinar la mejor manera de distribuirlas, ya que algunas las podría manejar mejor Python, mientras que otras son más apropiadas para el shell.

Clasifiqué cada responsabilidad en uno de tres grupos:

| Categoría | Responsabilidades |
| --- | --- |
| Solo Python | Generación y hash de banderas, tokens de verificación, almacenamiento del estado del CTF, MOTD, verificación de preparación de la configuración, CLI `verify`, retos 1, 2, 3, 5, 7, 8, 9, 13, 15, 16 y marcador de finalización |
| Solo subprocess | Instalación de paquetes, gestión de usuarios para `ctf_user`, `flag_user` y `old_admin`, y los comandos de sistema de archivos del reto 18 |
| Mixto | Configuración del SO y de SSH, retos 4, 6, 10, 11, 12, 14 y 17 |

---

## Configuración en el primer arranque

Otra cosa que tenía en mente al entrar en esta refactorización era un rol más limpio para la configuración del primer arranque. Ya la estábamos usando. En AWS y Azure eso es cloud-init leyendo los datos de usuario o los datos personalizados; en GCP es el ejecutor del script de arranque. Pero la habíamos tratado como un lugar para volcar toda la configuración del CTF.

En mi cabeza, para este laboratorio, el primer arranque debería hacer una sola cosa: llevar la VM a un estado donde la configuración real pueda tomar el control. Instalar un par de prerrequisitos y luego ceder el paso. La configuración del CTF en sí (paquetes, usuarios, banderas, retos, servicios, MOTD) no debería vivir dentro de los datos de arranque. Debería ser algo a lo que el primer arranque llame.

## La implementación

En el [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) hicimos el trabajo.

1. Convertimos `ctf_setup.sh` en un bootstrap ligero. Activa el comportamiento estricto del shell, revisa un marcador de idempotencia en el directorio de estado por instancia de cloud-init, instala `uv` para que la VM no dependa del Python del sistema, ejecuta la configuración en Python, instala la CLI `verify`, y solo escribe el marcador de éxito si la configuración realmente terminó.
2. Movimos la configuración real a un paquete de Python `setup/`, dividido por responsabilidad: orquestación, generación de banderas, configuración del sistema, estado, ayudantes compartidos para `subprocess` y systemd, y un archivo por reto.
3. Movimos el comando `verify` orientado a quienes aprenden a su propio paquete `verify/` usando `argparse`, `rich` y `pyfiglet`. Eso eliminó el heredoc de Bash de 350 líneas y las dependencias `figlet` / `lolcat`.

La refactorización también me dio la oportunidad de revisar cada reto. Cada uno se movió a su propio archivo bajo `setup/challenges/`, lo que hizo mucho más fácil leer lo que un reto realmente hace sin tener que pasar por encima de otros diecisiete. La mayoría fueron adaptaciones directas del Bash existente. Algunos valían una segunda mirada:

- **Reto 9 (DNS)** solía modificar `/etc/resolv.conf`. En las imágenes de nube de Ubuntu ese archivo es propiedad de `systemd-resolved` y sobrescribirlo pelea con la plataforma. La nueva versión deja un archivo de configuración bajo `/etc/systemd/resolved.conf.d/` y dirige a quienes aprenden a usar `resolvectl` en su lugar.
- **Reto 18 (sistemas de archivos)** se mantuvo basado en shell a propósito. `mkfs.ext4`, `mount` y `umount` no tienen un equivalente limpio en la biblioteca estándar, así que Python simplemente los orquesta a través de `subprocess`.
- **Los retos de gestión de usuarios** (alrededor de `ctf_user`, `flag_user` y `old_admin`) siguieron llamando a `useradd`, `chpasswd` y `usermod` por la misma razón.

Aquí es donde `subprocess` brilla. Python se convirtió en el proceso padre. Maneja la estructura, las rutas, el estado, los archivos y la orquestación de comandos. Los comandos de Linux siguen haciendo el trabajo de Linux, porque no hay un reemplazo limpio en la biblioteca estándar. Un pequeño ayudante `run()` en `helpers.py` es el puente:

---

## Lo que el testing dejó al descubierto

Luego probé la nueva implementación. Como en toda refactorización, nada es perfecto en el primer intento.

Lo primero que había olvidado era cómo llegaba realmente el laboratorio a la VM. El código de Terraform anterior simplemente descargaba un único `ctf_setup.sh` desde GitHub y se lo entregaba al primer arranque. Eso funcionaba cuando la configuración era un solo archivo. Después de la refactorización, la VM necesitaba `ctf_setup.sh`, `setup/` y `verify/` juntos, y ya no había un único archivo que descargar.

Así que cuando desplegué la nueva configuración, todavía estaba cargando el viejo `ctf_setup.sh`. Esto llevó al siguiente problema: ¿cómo hacemos que los directorios `setup/` y `verify/` estén disponibles para la VM?

El script de bootstrap ligero en sí cabe sin problema en los datos del primer arranque. El paquete no. Los datos del primer arranque nunca se pensaron como un transporte de paquetes, y en AWS ni siquiera cabría (los datos de usuario están limitados a 16 KB antes de la codificación base64). Así que el bootstrap tenía que quedarse en los datos del primer arranque, y el paquete tenía que llegar a la VM de otra forma.

Después de investigar un poco, también consideré integrar todo en una imagen de VM personalizada por proveedor para que el primer arranque casi no tuviera nada que hacer. Registré esa idea como uno de los enfoques en el [issue #83](https://github.com/learntocloud/linux-ctfs/issues/83) para verla más adelante. Por ahora era demasiado trabajo para una refactorización que ya estaba tocando suficientes cosas, y siempre podemos iterar más tarde. Así que optamos por el arreglo más simple a corto plazo: dos modos, controlados por una variable de Terraform (`use_local_setup`).

1. **Modo de lanzamiento** despliega desde un lanzamiento versionado de GitHub. Un flujo de trabajo de GitHub Actions (`.github/workflows/release-setup.yml`) construye un `linux-ctfs-setup.tar.gz` más una suma de verificación sha256 en cada lanzamiento etiquetado. Luego Terraform inyecta un pequeño bootstrap en línea en los datos del primer arranque de la nube (datos de usuario en AWS, datos personalizados en Azure, script de arranque en GCP). Ese script en línea no es `ctf_setup.sh`. Su único trabajo es descargar el tarball para el `setup_release_tag` fijado, verificar la suma de verificación, descomprimirlo y luego ejecutar el `ctf_setup.sh` que vive dentro del tarball. Esto lo mantiene simple para quienes aprenden, porque todo lo que tienen que hacer es `terraform init` y `terraform apply`. No tiene que existir nada local en su máquina más allá de la configuración de Terraform, pero el repositorio sigue conteniendo todo el código, así que también es una oportunidad de aprendizaje si quieren explorar la base de código.
2. **Modo colaborador** despliega completamente desde archivos locales. Terraform sube los `ctf_setup.sh`, `setup/` y `verify/` locales por SSH después de que la VM arranca, así que se pueden probar cambios sin fusionar antes de que exista un lanzamiento. Esto es ideal para quienes contribuyen al laboratorio. Es opcional mediante la variable `use_local_setup = true`.

Trabajar con lanzamientos también nos dio un artefacto real al que apuntar. Cada actualización del laboratorio es ahora un lanzamiento etiquetado, y quienes aprenden y contribuyen pueden leer las notas del lanzamiento para entender qué cambió. Ya no hay que escarbar entre commits o PRs para averiguar qué hay en una versión dada del laboratorio.

---

## Preparación

Después de que se fusionó el [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89), saqué [`v0.1.0`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.0) y probé la ruta de lanzamiento en Azure. El tarball se descargó, verificó, descomprimió y ejecutó sin problemas. Pero la experiencia de quien aprende todavía tenía un filo: Terraform imprimía la IP de la VM tan pronto como el proveedor de nube consideraba la VM creada, lo cual era bastante antes de que `ctf_setup.sh` hubiera terminado de verdad. Alguien podía conectarse por SSH demasiado pronto y encontrar el MOTD ausente, los servicios sin ejecutarse y los archivos de los retos aún sin escribir.

El arreglo limpio es nativo de cada proveedor: la extensión de script personalizado de VM de Azure, AWS SSM Run Command, algo equivalente en GCP. Cada uno tiene un costo real en permisos e infraestructura, y los tres proveedores no se comportan igual. Abrí el [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) para diseñar eso correctamente más adelante.

Para el arreglo inmediato, el [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) agregó una espera de preparación entre proveedores. La configuración en Python escribe un marcador de éxito al completarse y un marcador de fallo si revienta. Terraform consulta esos marcadores por SSH y solo devuelve los detalles de conexión de la VM una vez que existe el marcador de éxito. Si aparece el marcador de fallo, falla temprano en lugar de fingir que el laboratorio está listo.

Luego saqué [`v0.1.1`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1) y volví a probar. SSH esperó hasta que el laboratorio estuvo realmente listo, el MOTD apareció y los retos estaban en su lugar.

También recorrí cada reto a mano en la VM en vivo, capturé cada bandera y confirmé que los dieciocho funcionaban de principio a fin. Una gran oportunidad para validar al 100% y repasar mis habilidades de bash.

---

## El testing como algo de primera clase

Las pruebas manuales hicieron su trabajo, pero también me mostraron dónde la propia configuración de pruebas era débil. Salieron tres cosas de ahí.

### Una skill de pruebas del CTF más limpia

`.github/skills/ctf-testing/SKILL.md` eran las instrucciones orientadas al agente sobre cómo probar el laboratorio. Se había desviado con el tiempo y ya no era el primer lugar al que enviaría a un agente que quisiera probar un cambio.

Lo rehíce hasta dejarlo en dos modos:

- **Prueba básica**: desplegar en un proveedor y ejecutar la suite completa de retos, sin reinicio.
- **Prueba completa**: lo mismo, más una pasada de validación con reinicio para asegurar que los marcadores de configuración, las unidades de systemd y la persistencia sobreviven a un reinicio.

Las frases que lo activan ahora son aburridas y obvias, como `Run a basic test on Azure` o `Run a full test on all providers`. La skill mantiene en un solo lugar el modo, la elección de proveedor, el comando, qué se está validando, la expectativa de limpieza y el reporte de resultados. La probé de principio a fin en Azure con `Run a basic test on Azure, the az cli is authenticated, use that subscription` y desplegó, validó los dieciocho retos, exportó el certificado, revisó los tokens y el comportamiento de congelación del tiempo, y luego limpió nueve recursos de Terraform sin dejar nada atrás.

### Un CONTRIBUTING.md más esbelto

También recorté `CONTRIBUTING.md` a lo que realmente necesita quien contribuye: las verificaciones locales, los comandos de prueba en la nube básica y completa, cómo se comporta el modo colaborador y notas breves de solución de problemas. Menos prosa, más «aquí está el comando, aquí está lo que hace».

### El script de orquestación es lo siguiente

El script local que en realidad ejecuta las pruebas en la nube sigue siendo Bash, y ha acumulado mucho estado. Maneja las llamadas a Terraform, los valores específicos de cada proveedor, SSH y SCP, los reintentos, los tiempos de espera, las verificaciones de marcadores de configuración, el flujo de reinicio, la limpieza y el reporte final. Eso es mucha ramificación para un script de shell.

El plan, registrado en el [issue #88](https://github.com/learntocloud/linux-ctfs/issues/88), es mantener el script de validación del lado de la VM en shell (porque esa parte está literalmente ejercitando la experiencia de línea de comandos de quien aprende) y reescribir el script de orquestación local en Python para que los tiempos de espera, la limpieza y el reporte de fallos dejen de sostenerse con `trap` y `set -e`. La estructura de la suite de pruebas en sí se rastrea por separado en el [issue #85](https://github.com/learntocloud/linux-ctfs/issues/85), con ideas como banderas `--challenge 10` y `--smoke` para no tener que ejecutar los dieciocho retos para validar un arreglo de una línea.

---

## Qué significa esto para quienes aprenden y contribuyen

A quienes aprenden no les importa que la configuración ahora sea Python, y la mayor parte de la experiencia ya existía antes de esta refactorización. Las ganancias que realmente obtienen son una configuración un poco más rápida en la ruta de lanzamiento probada en Azure, y notas de lanzamiento que sirven a la vez como notas de actualización del laboratorio, para que tengan un lugar claro donde ver qué cambió.

Para quienes contribuyen las ganancias son más inmediatas:

- El código de configuración está dividido por responsabilidad en lugar de vivir en un único archivo grande de Bash.
- El comando `verify` es un paquete de Python en lugar de un heredoc incrustado.
- El código de los retos es más fácil de encontrar, revisar y cambiar.
- El modo de lanzamiento usa activos de configuración versionados con sumas de verificación; el modo colaborador todavía admite pruebas locales sin fusionar.
- El trabajo de preparación a más largo plazo se rastrea en el [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) en lugar de quedar enterrado dentro de la refactorización.

Ahora quien contribuye puede cambiar un reto, probarlo localmente con el modo colaborador, abrir un PR, fusionarlo, publicar un lanzamiento y dejar que quienes aprenden desplieguen ese lanzamiento.

---

## Lo que aprendí

La refactorización empezó porque quería practicar una idea de un libro. Terminó tocando el empaquetado de lanzamientos, cloud-init, el comportamiento de Terraform, los límites de los datos del primer arranque, las pruebas de quienes contribuyen, la documentación para quienes aprenden y la validación manual. Así suelen ir las refactorizaciones útiles. Rara vez se tratan solo de la forma del código.

Bash sigue siendo la herramienta correcta para arrancar una VM. Python es la mejor herramienta una vez que ese arranque se convierte en una aplicación. `subprocess` es el puente entre esos dos trabajos.

Y gracias a las pruebas manuales, pude practicar mis habilidades de shell.
