---
title: "L2C Dev Log: Cómo hacer que las alertas de verificación sean útiles"
description: "Cómo auditamos las alertas de Azure de Learn to Cloud, mejoramos los health checks y smoke tests, e hicimos más confiable la telemetría de verificación."
pubDate: 2026-08-23
tags: ["learntocloud", "azure"]
lang: "es"
translationKey: "l2c-dev-log-making-verification-alerts-actionable"
---

Quiero empezar a compartir más sobre el trabajo diario detrás de construir y mantener Learn to Cloud. Estos posts serán menos como tutoriales y más como dev logs: qué se rompió, qué aprendimos y qué cambió.

El día de hoy empezó con una alerta de Azure Monitor por correo electrónico.

El problema era que no podía saber exactamente cuál había sido el error. Lo único que sabía era que estaba relacionado con el sistema de verificación. Eso fue suficiente para darme cuenta de que teníamos que mejorar la alerta. Una alerta debería ayudarte a entender qué necesita atención, no mandarte a buscar por qué existe.

Con Azure MCP descubrimos que la misma alerta se había activado tres veces durante las 24 horas anteriores. Cada una estaba relacionada con eventos del host o del ciclo de vida de Azure Functions. Estos eventos produjeron errores, pero ninguno fue causado por el código de nuestra aplicación.

Así que hicimos una pregunta sencilla: ¿esos eventos debieron provocar una alerta Sev1?

No.

## Auditar todas las alertas

Aprovechamos la oportunidad para auditar todas nuestras alertas. Empezamos con nueve. Algunas eran útiles, otras eran redundantes y otras necesitaban cambios.

En la primera revisión redujimos el total a seis.

Una de las alertas se activaba únicamente cuando al sistema de verificación le faltaba una variable de entorno u otro valor de configuración obligatorio. Seamos honestos: eso debería detectarlo nuestro proceso de CI y deployment, no una alerta en producción.

Agregamos una validación de startup más estricta para las variables de entorno obligatorias, incluyendo la URL base de verification Functions y el token scope.

El token scope le dice a Entra: "Emite para la API un token destinado a la Function app". La managed identity de la API y los permisos que tiene asignados determinan si está autorizada para recibir y usar ese token.

Esta validación de startup reemplazó la alerta de configuración.

## Darle una sola tarea a cada health check

En Terraform, cambiamos los startup y readiness probes del Container App de `/health` a `/ready`.

Estos endpoints responden preguntas diferentes:

- `/health` nos dice que el proceso de la API está activo y devuelve una respuesta exitosa.
- `/ready` comprueba que PostgreSQL esté disponible y que la base de datos tenga la versión de migración que espera la aplicación.

Los startup y readiness probes ahora llaman a `/ready`. El liveness probe y el availability test de Azure Monitor todavía llaman a `/health`.

También creamos `/internal/smoke/verification`, un endpoint de smoke test que ejecuta únicamente el código de preparación para enviar una verificación alojado en el Container App. Este endpoint:

- carga el currículo;
- selecciona un requisito;
- lee el estado relevante de la base de datos;
- comprueba los requisitos de la fase; y
- ejecuta el código que procesa los valores enviados.

Se detiene antes de crear un intento de verificación o invocar Durable Functions, así que no ejecuta una verificación completa.

Nuestro workflow `deploy.yml` ahora llama a `/ready` y al endpoint de smoke test. No llama a `/health`. El liveness probe de Container Apps y el availability test de Azure Monitor siguen encargándose de `/health`.

## Desenredar las alertas de verificación

Después analizamos más de cerca las tres alertas enfocadas en el sistema de verificación:

1. Errores HTTP 5xx de Functions.
2. Errores del sistema de verificación.
3. Otras excepciones de Azure Functions que no pertenecían a ninguna de las dos alertas anteriores.

Mientras intentaba entenderlas, me di cuenta de que no podía. Había demasiada redundancia y superposición sin una razón clara.

Revisamos el código y descubrimos que nuestra telemetría no correlacionaba bien los resultados. El resultado definitivo de un intento de verificación se guarda en la tabla `verification_attempts` de PostgreSQL, mientras que el logger de Python envía la telemetría estructurada de diagnóstico a Application Insights. Conectar ambos era más difícil de lo necesario.

En una serie de stacked PRs, nos aseguramos de incluir `attempt_id` en la telemetría estructurada de diagnóstico. Ahora podemos correlacionar esa telemetría con el resultado definitivo guardado en PostgreSQL.

También les dimos a las alertas nombres más claros basados en resultados y redujimos las alertas de verificación de tres a dos.

Ya no necesitábamos la alerta separada de HTTP de Functions. Un problema del sistema que nos impida devolver al estudiante un resultado normal, ya sea exitoso o fallido, debería:

- guardar un resultado `server_error`; o
- dejar el intento sin terminar el tiempo suficiente para activar la alerta de intentos atascados.

Los errores normales de validación de los estudiantes son resultados esperados. No deberían activar ninguna de las alertas del sistema.

## Implementar los reemplazos de forma segura

Primero hicimos deployment de las dos alertas nuevas sin notificaciones. Esto nos permitió observar su comportamiento mientras las alertas anteriores seguían activas.

Después de confirmar que funcionaban correctamente, hicimos merge del PR de limpieza. Ese PR eliminó las tres alertas de verificación anteriores y habilitó las notificaciones para las dos nuevas.

Ahora tenemos cinco alertas en total:

1. Disponibilidad.
2. Errores 5xx de la API.
3. Diferencias en el esquema de la base de datos.
4. Errores del sistema de verificación.
5. Intentos de verificación atascados.

Ahora confío en la telemetría y las alertas del sistema de verificación. Mañana haré un análisis más profundo de las alertas y la telemetría de la API. Estoy siguiendo ese trabajo en el [issue #767 de Learn to Cloud](https://github.com/learntocloud/learn-to-cloud-app/issues/767).
