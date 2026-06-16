---
title: "verificar el tiempo y el reloj de pared"
description: "Qué mide en realidad el temporizador del CTF, un arreglo pequeño pero importante que publiqué, y por qué decidí no cambiar el modelo de fondo."
pubDate: 2026-05-26
tags: ["linux", "learntocloud"]
lang: "es"
translationKey: "verify-time-wall-clock"
---

El [CTF de la Fase 1 de Learn to Cloud](https://github.com/learntocloud/linux-ctfs) es un laboratorio que armé para darte una forma real y práctica de poner a prueba tus habilidades con la línea de comandos de Linux después de pasar por el contenido de la Fase 1 en [learntocloud.guide](https://learntocloud.guide). La idea es simple: dieciocho retos progresivos, todos resueltos con nada más que una terminal y el conocimiento que fuiste construyendo durante días o semanas de estudio.

El comando `verify time` existe para responder una pregunta natural: "¿cuánto me tomó esto?". Pero últimamente me di cuenta de que la respuesta que da no siempre es la más útil. Esta entrada trata sobre qué mide en realidad `verify time`, un pequeño arreglo que publiqué en el camino, y por qué decidí no cambiar el modelo de fondo.

---

## El objetivo de `verify time`

Cuando diseñé el CTF, me imaginé que la persona típica iba a pasar por la [Fase 1](https://learntocloud.guide) durante varios días o semanas antes de intentar el laboratorio. El laboratorio en sí, con dieciocho retos que cubren archivos ocultos, análisis de logs, redes, inspección de procesos y análisis forense de discos, lo diseñé para completarse en unas pocas horas de concentración, de una sola sentada.

En ese modelo, `verify time` como reloj de pared tenía todo el sentido. Te conectas por SSH, empiezas a resolver retos y, cuando terminas, `verify time` te dice cuánto tiempo estuviste ahí adentro. Limpio, simple, honesto.

Pero la gente que aprende me ha sorprendido con la forma en que realmente usa el laboratorio. Algunos lo empiezan temprano en su camino por la Fase 1, como una manera de descubrir lo que todavía no saben. Otros se toman varios días: apagan la VM en la noche y la retoman a la mañana siguiente. Y otros destruyen y vuelven a crear la VM por completo, tomando notas de su trabajo y reconstruyendo su entorno como parte del aprendizaje. En todos esos casos, el tiempo de reloj de pared sigue siendo tiempo de reloj de pared. El temporizador no sabe que estabas dormido.

Eso no es un bug. Es simplemente lo que mide la herramienta.

---

## Cómo funcionaba `verify time` antes

El temporizador arranca en el momento en que envías tu primer flag con `verify <number> <flag>`. Esa marca de tiempo se escribe en `/var/ctf/ctf_start_time`. Cada llamada posterior a `verify time` lee ese archivo y lo resta del reloj actual.

```bash
local start_time=$(cat "$START_TIME_FILE")
local current_time=$(date +%s)
local elapsed=$((current_time - start_time))
```

Simple y correcto. El problema era lo que pasaba en `verify export`.

Cuando alguien termina los 18 retos y corre `verify export <github_username>`, el comando genera un certificado de finalización firmado y un token. El tiempo de finalización que quedaba grabado en ese token se calculaba de la misma forma: `now - start`. O sea que alguien que terminaba el martes pero corría `verify export` el jueves obtenía un certificado que mostraba un tiempo de finalización de más de 48 horas, aunque solo hubiera dedicado tres horas a resolver los retos de verdad.

No había marca de tiempo de fin. El reloj nunca se detenía.

---

## Cómo funciona ahora

El [PR #80](https://github.com/learntocloud/linux-ctfs/pull/80) agregó un segundo archivo: `/var/ctf/ctf_end_time`. La primera vez que se corre `verify export` después de completar los 18 retos, esa marca de tiempo se escribe una sola vez y nunca se vuelve a actualizar.

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

Tanto `verify time` como `verify export` ahora pasan por un helper compartido, `get_elapsed_seconds()`, que primero revisa si existe ese archivo de fin. Si existe, el tiempo transcurrido queda congelado en ese valor. Si no, se usa el reloj en vivo. El resultado: la primera vez que corres `verify export` después de terminar, tu tiempo de finalización queda fijo. Si lo vuelves a correr una semana después, obtienes exactamente el mismo número. Ahora el certificado significa algo concreto.

También actualicé la documentación del MOTD y del README en los tres proveedores de nube para explicar este comportamiento con claridad, incluyendo una nota para quienes usan AWS y Azure: el tiempo de apagar y prender la VM sigue contando como tiempo transcurrido hasta que se corre ese primer export.

Si quieres leer sobre la sesión completa detrás de este cambio, con la investigación, las decisiones y el ida y vuelta que le dieron forma a la implementación, la [crónica de la sesión en el PR #80](https://github.com/learntocloud/linux-ctfs/pull/80#issuecomment-4547297627) lo cubre en detalle. También es un ejemplo de cómo abordo el uso de la IA en mi trabajo de mantenimiento de open source.

---

## ¿Debería cambiar?

La pregunta honesta al final de todo esto es si `verify time` debería intentar medir algo más preciso, como el tiempo de trabajo activo. Restar el tiempo que la VM estuvo apagada, manejar a quienes destruyen y recrean VMs, o registrar las ventanas de sesión activas.

No.

Este es un proyecto gratuito y de open source que mantengo principalmente por mi cuenta, además de una agenda llena de contenido, trabajo de comunidad y todo lo demás. Construir un registro preciso del tiempo activo implicaría publicar un daemon, persistir el estado entre recreaciones de la VM, manejar ciclos de vida parciales de la VM y probar todo eso en AWS, Azure y GCP. La complejidad es real y el beneficio es marginal para lo que esta herramienta realmente es.

El CTF es una herramienta de aprendizaje, no un benchmark de rendimiento. Que te haya tomado tres horas o tres días no es el punto. El punto es que pasaste por dieciocho retos de Linux y saliste del otro lado con habilidades que antes no tenías.

`verify time` es un reloj de pared. Úsalo en consecuencia.
