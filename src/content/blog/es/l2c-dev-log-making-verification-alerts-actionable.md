---
title: "Auditoría de alertas de Azure Monitor: Mejorar las alertas de verificación"
description: "Cómo Azure MCP y los canvases nos ayudaron a auditar las alertas de Learn to Cloud, mejorar los checks de deployment y rediseñar la telemetría de verificación."
pubDate: 2026-08-23
tags: ["learntocloud", "azure"]
lang: "es"
translationKey: "l2c-dev-log-making-verification-alerts-actionable"
---

La API de Learn to Cloud es el límite principal de la aplicación. Atiende las solicitudes de la app, lee y escribe sus datos, y coordina el trabajo detrás de la experiencia del estudiante.

El sistema de verificación es una parte de esa API. Cuando un estudiante envía trabajo para verificarlo, la API prepara el envío e inicia el flujo de verificación. Ese flujo puede llamar a Azure Functions y guarda el resultado del intento de verificación.

Este post se enfoca en las alertas para ese límite de verificación. El post siguiente cubre las alertas del resto de la API: disponibilidad, errores de la API, telemetría y diferencias en el esquema de la base de datos.

Recibí una alerta de Azure Monitor por correo electrónico. No podía saber exactamente cuál había sido el error, así que me di cuenta de que teníamos que mejorar la alerta. Lo único que sabía era que estaba relacionada con el sistema de verificación.

Usamos Azure MCP para descubrir que la misma alerta se había activado tres veces durante las 24 horas anteriores. Cada una estaba relacionada con eventos del host o del ciclo de vida de Azure Functions. Estos eventos causaron errores, pero ninguno fue provocado por el código de nuestra aplicación.

Así que hicimos una pregunta sencilla: ¿esos eventos debieron provocar una alerta Sev1?

No.

## Usar canvases para entender las alertas

Usamos un canvas de Azure Exception Anatomy para analizar la alerta y las tres excepciones detrás de ella. Esto nos ayudó a entender la diferencia entre la prioridad Sev1 de la alerta y el nivel de severidad de la telemetría en Application Insights. También nos mostró que las excepciones venían del comportamiento del host y del ciclo de vida de Azure Functions, no de nuestro código de verificación.

Después usamos un canvas de Alert Audit Workbench para revisar cada alerta. Así tuvimos un solo lugar donde comparar la query, la severidad, el propósito, la evidencia reciente en producción y nuestra decisión de mantener, modificar, reemplazar o eliminar cada alerta.

<figure>
  <img src="/images/l2c-dev-log/alert-audit-workbench.png" alt="Canvas de Alert Audit Workbench con los grupos de alertas originales y las decisiones de mantener o modificar cada uno" loading="lazy" />
  <figcaption>Alert Audit Workbench con las decisiones para las alertas originales.</figcaption>
</figure>

Los canvases fueron útiles porque convirtieron la telemetría sin procesar de Azure y la configuración de Terraform en algo que podíamos inspeccionar y analizar. Azure MCP proporcionó la evidencia real de producción, mientras que los canvases nos ayudaron a organizarla y entenderla.

## Auditar las alertas originales

Aprovechamos la oportunidad para auditar todas nuestras alertas. Empezamos con nueve. Algunas eran útiles, otras eran redundantes y otras necesitaban cambios.

En la primera revisión redujimos el total a seis.

Una de las alertas se activaba únicamente cuando al sistema de verificación le faltaba una variable de entorno u otro valor de configuración obligatorio. Seamos honestos: eso debería detectarlo nuestro proceso de CI y deployment, no una alerta en producción.

Primero, agregamos una validación de startup más estricta para las variables de entorno obligatorias, incluyendo la URL base de verification Functions y el token scope.

```python
if not self.verification_functions.base_url:
    raise ValueError(
        "VERIFICATION_FUNCTIONS__BASE_URL must be set "
        "when ENVIRONMENT=production."
    )

if not self.verification_functions.token_scope:
    raise ValueError(
        "VERIFICATION_FUNCTIONS__TOKEN_SCOPE must be set "
        "when ENVIRONMENT=production."
    )
```

La URL base le dice a la API dónde está la Function app. El token scope le dice a Entra que emita para la API un token destinado a la Function app. La managed identity de la API y los permisos que tiene asignados determinan si está autorizada para recibir y usar ese token.

Esta validación de startup, y no el endpoint de smoke test, reemplazó la alerta de configuración.

## Mejorar los health checks y readiness checks

En Terraform, cambiamos el startup probe y el readiness probe a `/ready`. Antes, ambos usaban `/health`, que solo nos dice que el proceso de la API está activo y devuelve un 200.

```hcl
liveness_probe {
  transport = "HTTP"
  path      = "/health"
  port      = 8000
}

readiness_probe {
  transport = "HTTP"
  path      = "/ready"
  port      = 8000
}

startup_probe {
  transport = "HTTP"
  path      = "/ready"
  port      = 8000
}
```

`/ready` comprueba que PostgreSQL esté disponible y que la base de datos tenga la versión de migración que espera la aplicación. El liveness probe y el availability test de Azure Monitor todavía usan `/health`.

`deploy.yml` llama a `/ready`. No llama a `/health`. Container Apps ejecuta automáticamente los liveness, readiness y startup probes.

## Agregar el smoke test de verificación

También creamos el endpoint de smoke test, `/internal/smoke/verification`. Este ejecuta únicamente el código de preparación para enviar una verificación alojado en el Container App.

Carga el currículo, selecciona un requisito, lee el estado relevante de la base de datos, comprueba los requisitos de la fase y ejecuta el código que procesa los valores enviados. Se detiene antes de crear un intento de verificación o invocar Durable Functions, así que no ejecuta una verificación completa.

```python
ctx = await _check_submission_preconditions(
    session_maker,
    user_id=_SMOKE_USER_ID,
    requirement_slug=requirement.slug,
)

try:
    SubmittedValue.from_raw(ctx.requirement, "smoke-test")
except ValueError:
    pass
```

El smoke test es valioso porque `/ready` puede responder correctamente cuando PostgreSQL está disponible y las migraciones están al día, mientras que el código real de submissions todavía podría fallar porque la aplicación y el esquema de la base de datos no funcionan bien juntos.

`deploy.yml` llama primero a `/ready` y luego al endpoint de smoke test con un token de Entra de corta duración obtenido mediante GitHub OIDC.

## Rediseñar la telemetría y las alertas de verificación

Después profundizamos en las tres alertas enfocadas en el sistema de verificación:

1. Errores HTTP 5xx de Functions.
2. Errores del sistema de verificación.
3. Otras excepciones de Azure Functions que no pertenecían a ninguna de las dos alertas anteriores.

Mientras intentaba entenderlas, me di cuenta de que no podía porque parecían tener redundancia y superposición sin ninguna razón.

Revisamos el código y nos dimos cuenta de que nuestra telemetría no correlacionaba bien los resultados. El resultado de un intento de verificación se guarda en la tabla `verification_attempts` de PostgreSQL, mientras que el logger de Python envía telemetría estructurada de diagnóstico a Application Insights.

En una serie de stacked PRs, nos aseguramos de incluir `attempt_id` en la telemetría estructurada de diagnóstico para poder correlacionarla con el resultado definitivo guardado en PostgreSQL.

```python
attributes={
    "verification.attempt.id": str(attempt_id),
}
```

Esto significa que ahora podemos tomar un error o evento de diagnóstico de Application Insights y conectarlo con el intento de verificación y el resultado exactos guardados en PostgreSQL.

También creamos nombres más claros basados en resultados y redujimos las alertas del sistema de verificación de tres a dos.

<figure>
  <img src="/images/l2c-dev-log/verification-alert-design.png" alt="Canvas del diseño de alertas de verificación que compara el flujo actual con alertas superpuestas y el flujo ideal con dos rutas" loading="lazy" />
  <figcaption>El canvas de alertas de verificación nos ayudó a pasar de alertas superpuestas a dos rutas claras basadas en resultados.</figcaption>
</figure>

Ya no necesitábamos la alerta separada de HTTP de Functions. Un problema del sistema que nos impida devolver al estudiante un resultado normal, ya sea exitoso o fallido, debería:

- guardar un resultado `server_error`; o
- dejar el intento sin terminar el tiempo suficiente para activar la alerta de intentos atascados.

Los errores normales de validación de los estudiantes son resultados esperados y no deberían activar ninguna de las alertas del sistema.

Primero hicimos deployment de las dos alertas nuevas sin notificaciones. Esto nos permitió observar su comportamiento mientras las alertas anteriores seguían activas.

Después de confirmar que funcionaban correctamente, hicimos merge del PR de limpieza. Ese PR eliminó las tres alertas de verificación anteriores y habilitó las notificaciones para las dos nuevas.

## Diseño final de alertas

Ahora tenemos cinco alertas en total:

1. Disponibilidad.
2. Errores 5xx de la API.
3. Diferencias en el esquema de la base de datos.
4. Errores del sistema de verificación.
5. Intentos de verificación atascados.

Ahora confío en la telemetría y las alertas del sistema de verificación. Mañana haré un análisis más profundo de las alertas y la telemetría de la API. Estoy siguiendo ese trabajo en el [issue #767 de Learn to Cloud](https://github.com/learntocloud/learn-to-cloud-app/issues/767).
