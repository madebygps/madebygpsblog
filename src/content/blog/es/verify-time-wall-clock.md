---
title: "verificar el tiempo y el reloj de pared"
description: "Qué mide en realidad el temporizador del CTF, un arreglo pequeño pero importante que publiqué, y por qué decidí no cambiar el modelo de fondo."
pubDate: 2026-05-26
tags: ["linux", "learntocloud"]
lang: "es"
translationKey: "verify-time-wall-clock"
---

El [CTF de la Fase 1 de Learn to Cloud](https://github.com/learntocloud/linux-ctfs) es un laboratorio que creé para darle a quienes aprenden una forma real y práctica de poner a prueba sus habilidades con la línea de comandos de Linux después de estudiar el contenido de la Fase 1 en [learntocloud.guide](https://learntocloud.guide). La idea es simple: dieciocho retos progresivos, todos resueltos únicamente con una terminal y el conocimiento que construiste a lo largo de días o semanas de estudio.

El comando `verify time` existe para responder una pregunta natural: «¿Cuánto me tomó esto?». Pero últimamente noté que la respuesta que da no siempre es la más significativa. Esta entrada trata sobre qué mide realmente `verify time`, un pequeño arreglo que publiqué en el camino, y por qué decidí no cambiar el modelo de fondo.

---

## El objetivo de `verify time`

Cuando diseñé el CTF, imaginé que la persona típica trabajaría a través de la [Fase 1](https://learntocloud.guide) durante varios días o semanas antes de intentar el laboratorio. El laboratorio en sí, con dieciocho retos que abarcan archivos ocultos, análisis de registros, redes, inspección de procesos y análisis forense de discos, fue diseñado para completarse en unas pocas horas concentradas en una sola sesión.

En ese modelo, `verify time` como reloj de pared tenía todo el sentido. Te conectas por SSH, empiezas a resolver retos y, cuando terminas, `verify time` te dice cuánto tiempo estuviste ahí dentro. Limpio, simple, honesto.

Pero quienes aprenden me han sorprendido con la forma en que realmente usan el laboratorio. Algunos lo empiezan temprano en su recorrido de la Fase 1 como una manera de descubrir lo que todavía no saben. Algunos se toman varios días, apagando la VM por la noche y retomándola a la mañana siguiente. Otros destruyen y vuelven a crear la VM por completo, tomando notas de su trabajo y reconstruyendo su entorno como parte de la experiencia de aprendizaje. En todos estos casos, el tiempo de reloj de pared sigue siendo tiempo de reloj de pared. El temporizador no sabe que estabas dormido.

Eso no es un error. Es simplemente lo que mide la herramienta.

---

## Cómo funcionaba `verify time` antes

El temporizador empieza en el momento en que envías tu primera bandera con `verify <number> <flag>`. Esa marca de tiempo se escribe en `/var/ctf/ctf_start_time`. Cada llamada posterior a `verify time` lee ese archivo y lo resta del reloj actual.

```bash
local start_time=$(cat "$START_TIME_FILE")
local current_time=$(date +%s)
local elapsed=$((current_time - start_time))
```

Simple y correcto. El problema era lo que pasaba en `verify export`.

Cuando alguien termina los 18 retos y ejecuta `verify export <github_username>`, el comando genera un certificado de finalización firmado y un token. El tiempo de finalización incluido en ese token se calculaba de la misma forma: `now - start`. Lo que significa que alguien que terminó el martes pero ejecutó `verify export` el jueves obtenía un certificado que mostraba un tiempo de finalización de más de 48 horas, aunque solo hubiera dedicado tres horas a resolver los retos de verdad.

No había marca de tiempo de fin. El reloj nunca se detenía.

---

## Cómo funciona ahora

El [PR #80](https://github.com/learntocloud/linux-ctfs/pull/80) agregó un segundo archivo: `/var/ctf/ctf_end_time`. La primera vez que se llama a `verify export` después de completar los 18 retos, esa marca de tiempo se escribe una vez y nunca se vuelve a actualizar.

```bash
freeze_end_time_on_export() {
    if [ -f "$END_TIME_FILE" ]; then
        return
    fi
    if [ "$completed" -ge 18 ]; then
        date +%s > "$END_TIME_FILE"
    fi
}
```

Tanto `verify time` como `verify export` ahora pasan por un ayudante compartido `get_elapsed_seconds()` que primero busca ese archivo de fin. Si existe, el tiempo transcurrido se congela en ese valor. Si no existe, se usa el reloj en vivo. El resultado: la primera vez que ejecutas `verify export` después de terminar, tu tiempo de finalización queda fijado. Ejecútalo de nuevo una semana después y obtienes exactamente el mismo número. El certificado ahora significa algo específico.

Los documentos del MOTD y del README en los tres proveedores de nube también se actualizaron para explicar este comportamiento con claridad, incluyendo una nota para quienes usan AWS y Azure de que el tiempo de detener e iniciar la VM sigue contando como tiempo transcurrido hasta que se ejecuta ese primer export.

Si quieres leer sobre la sesión completa detrás de este cambio, incluyendo la investigación, las decisiones y el ida y vuelta que dieron forma a la implementación, la [crónica de la sesión en el PR #80](https://github.com/learntocloud/linux-ctfs/pull/80#issuecomment-4547297627) lo cubre en detalle. También es un ejemplo de cómo enfoco el uso de la IA en mi trabajo de mantenimiento de código abierto.

---

## ¿Debería cambiar?

La pregunta honesta al final de todo esto es si `verify time` debería intentar medir algo más preciso, como el tiempo trabajando de forma activa. Restar el tiempo que la VM estuvo apagada, manejar a quienes destruyen y recrean VMs, o rastrear ventanas de sesión activas.

No.

Este es un proyecto gratuito y de código abierto que mantengo principalmente por mi cuenta, junto con una agenda llena de contenido, trabajo comunitario y todo lo demás. Construir un seguimiento preciso del tiempo activo significaría publicar un demonio, persistir el estado a través de recreaciones de la VM, manejar ciclos de vida parciales de la VM y probar todo eso en AWS, Azure y GCP. La complejidad es real y el beneficio es marginal para lo que esta herramienta realmente es.

El CTF es una herramienta de aprendizaje, no una prueba de rendimiento. Que te haya tomado tres horas o tres días no es el punto. El punto es que trabajaste a través de dieciocho retos de Linux y saliste del otro lado con habilidades que antes no tenías.

`verify time` es un reloj de pared. Úsalo en consecuencia.
