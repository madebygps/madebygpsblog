---
title: "Auditoría de alertas de Azure Monitor: Mejorar las alertas y la telemetría de la API"
description: "Una mirada más cercana a las alertas de la API de Learn to Cloud, los vacíos de telemetría que encontramos y los cambios que hicieron más confiables las alertas restantes."
pubDate: 2026-08-24
tags: ["learntocloud", "azure"]
lang: "es"
translationKey: "what-we-found-in-our-api-alert-audit"
---

La API de Learn to Cloud es el límite principal de la aplicación. Atiende las solicitudes de la app, lee y escribe sus datos, y coordina el trabajo detrás de la experiencia del estudiante.

El sistema de verificación es una parte de esa API. Cuando un estudiante envía trabajo para verificarlo, la API prepara el envío e inicia el flujo de verificación. Ese flujo puede llamar a Azure Functions y guarda el resultado del intento de verificación.

Las alertas de verificación se cubren en [Auditoría de alertas de Azure Monitor: Mejorar las alertas de verificación](https://www.madebygps.com/blog/l2c-dev-log-making-verification-alerts-actionable/). Este post se enfoca en todo lo que queda fuera de ese límite: disponibilidad de la API, errores de la API, telemetría y diferencias en el esquema de la base de datos.

Ayer revisamos todas nuestras alertas de Azure Monitor y redujimos el total a cinco. Dos cubren el sistema de verificación. Las otras tres cubren el resto de la API.

Escribí sobre el trabajo de verificación en [Cómo hacer que las alertas de verificación sean útiles](https://www.madebygps.com/blog/l2c-dev-log-making-verification-alerts-actionable/).

Hoy nos enfocamos en las tres alertas de la API: disponibilidad, errores 5xx de la API y diferencias en el esquema de la base de datos.

## Usar un canvas para auditar las alertas

Creamos otro canvas para este trabajo. Me encantan los canvases para reunir contexto y lograr una comprensión profunda antes de cambiar algo.

Hicimos varias rondas de auditoría para cada alerta. El canvas me permitió ver:

- qué consulta la alerta;
- qué código de la API emite los datos de los que depende;
- qué cubre realmente la alerta; y
- si debíamos mantenerla, modificarla o eliminarla.

Esta es mi forma favorita de trabajar algo como las alertas. Los skills y los servidores MCP pueden seguir llevando información real al canvas, mientras que el canvas nos da un lugar para entender qué significa y avanzar hacia una solución informada.

## Lo que encontró la auditoría

La auditoría descubrió varias cosas importantes.

Nuestro availability test solo usaba dos ubicaciones. La alerta de schema drift tenía dos puntos ciegos. Nuestra alerta de HTTP 5xx excluía rutas, lo que se sentía como un code smell. La configuración de telemetría podía fallar mientras la app seguía funcionando sin avisarnos, lo que significaba que podíamos perder telemetría silenciosamente.

Tampoco podíamos saber qué revisión de Container Apps había producido un error de la aplicación. Por último, nuestras pruebas de telemetría solo comprobaban que se emitiera telemetría. No comprobaban que los datos emitidos coincidieran con las consultas de las que dependen nuestras alertas.

Ese último punto es muy importante. Una alerta puede verse correcta en Terraform y volverse inútil silenciosamente si la forma de la telemetría cambia.

## Lo que costó el trabajo y lo que aprendimos

El trabajo original de alertas costó **3,672.74 créditos de IA, o $36.73**, entre 701 llamadas al modelo y 97.7 millones de tokens procesados.

| Trabajo | Costo |
| --- | --- |
| Auditoría y planificación | $28.12 |
| PR #770 | $5.04 |
| PR #771 | $0.85 |
| PR #772 | $0.39 |
| Corrección en PR #773 | $2.33 |

Solo la auditoría usó el **76.6%** del total. La mayor parte del costo evitable vino de cuatro lugares:

1. Creamos por error el PR #769 para un canvas del repositorio en lugar de un canvas solo para la sesión.
2. Volvimos a leer repetidamente un canvas y una conversación grandes.
3. Mezclamos la recopilación de evidencia, las decisiones, la planificación de implementación y la coordinación del deployment en una sesión larga.
4. Un contrato de telemetría ambiguo llevó al PR correctivo #773.

Si hiciera esto de nuevo, usaría una sesión de auditoría de solo lectura con recopilación de evidencia en paralelo. Guardaría los hechos en `facts.json`, las decisiones en un `decisions.md` compacto y cada ronda de auditoría en su propio archivo append-only. El canvas mostraría solo la ronda activa y el resumen de decisiones aprobadas.

También escribiría un contrato de implementación explícito que cubriera la configuración de startup, las fallas del exporter en runtime, las pruebas, las consultas de alerta y las puertas de deployment. Cada límite de deployment tendría su propia sesión de implementación. Los deployments solo seguirían siendo secuenciales cuando la evidencia de producción tuviera que habilitar el siguiente PR.

Ese enfoque probablemente habría reducido el uso de IA a la mitad o más. Más sesiones solo habrían ayudado en límites claros de contexto. Más sesiones de implementación simultáneas no habrían ayudado, porque PR #771 dependía de validar PR #770 en producción.

El total actual de cinco sesiones, incluyendo la actividad posterior de retrospectiva, es aproximadamente **$37.02**. Esto no incluye los cargos continuos de Azure Monitor y Log Analytics, que requieren datos de Azure Cost Management y del volumen de ingesta.

La documentación de GitHub sobre [créditos de IA y precios de modelos](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) indica que un crédito de IA cuesta $0.01.

## Hacer que la telemetría de la API sea más confiable

[PR #770](https://github.com/learntocloud/learn-to-cloud-app/pull/770) agregó la revisión de Container Apps a la telemetría de la API mediante un OpenTelemetry Resource. Ahora, cuando ocurre un error, podemos ver de qué revisión vino.

```python
attributes = {
    "service.name": os.getenv("OTEL_SERVICE_NAME") or APP_LOGGER_NAMESPACE,
}

if revision := os.getenv("CONTAINER_APP_REVISION"):
    attributes["service.version"] = revision

instance_id = os.getenv("CONTAINER_APP_REPLICA_NAME") or os.getenv(
    "WEBSITE_INSTANCE_ID"
)
if instance_id:
    attributes["service.instance.id"] = instance_id
```

También movimos `global_exception_handler` al decorador `@app.exception_handler` de FastAPI. Este es el handler general para errores que no se manejan en ningún otro lugar.

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled.exception",
        extra={
            "exc_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
```

Eso nos dio una señal clara de `unhandled.exception` sobre la que alertar. También agregamos una alerta separada para el pipeline de telemetría que cubre fallas al configurarla o exportarla.

La alerta consulta la señal exacta del límite de excepciones en lugar de intentar inferir fallas de la aplicación a partir de cada respuesta 5xx:

```hcl
exceptions
| where cloud_RoleName == "learn-to-cloud-api"
| where outerMessage == "unhandled.exception"
| summarize CrashCount = count() by bin(timestamp, 5m)
```

Agregamos un runbook para responder a estas alertas y pruebas para los contratos de alerta. Las pruebas de contrato verifican no solo que exista telemetría, sino que sus campos coincidan con lo que esperan las consultas de alerta.

## Eliminar las alertas 5xx generales

[PR #771](https://github.com/learntocloud/learn-to-cloud-app/pull/771) eliminó las alertas 5xx generales que ya no necesitábamos.

Las alertas anteriores usaban exclusiones de rutas para evitar ruido. Eso hacía más difícil entender cómo se comportaba la alerta y nos dejaba preguntándonos si un error realmente estaba cubierto. El nuevo diseño de alertas es más intencional y más fácil de entender.

Después, [PR #772](https://github.com/learntocloud/learn-to-cloud-app/pull/772) limpió el runbook para que solo se refiera a las alertas actuales.

## Mantener la API funcionando cuando falla la telemetría

Después de revisar los cambios, me di cuenta de que [PR #770](https://github.com/learntocloud/learn-to-cloud-app/pull/770) había agregado `fail_on_azure_error=true`. Eso impediría que la API iniciara si no se podía configurar la telemetría.

No es lo que queremos.

Si hay un problema con la telemetría, la API debe seguir funcionando. Todavía necesitamos logs en la consola de Azure Container Apps, y la alerta del pipeline de telemetría debe avisarnos que tenemos que investigarla.

[PR #773](https://github.com/learntocloud/learn-to-cloud-app/pull/773) corrige esto. Mantiene disponible la API mientras hace visibles las fallas de telemetría.

```python
else:
    logger.error(
        "telemetry.configure.failed",
        extra={"reason": "telemetry_destination_missing"},
    )
    return
except Exception:
    logger.exception("telemetry.configure.failed")
    return
```

Mientras trabajábamos en ese cambio, encontramos otro problema. Si faltaba el connection string de Azure Monitor, nuestra configuración de logging podía volver a texto plano. Eso haría que la alerta del pipeline de telemetría no fuera confiable, porque no podría consultar los mismos campos en todas partes.

PR #773 elimina ese comportamiento condicional. Los logs ahora siempre son JSON, tanto localmente como en Azure Container Apps.

```python
console = logging.StreamHandler(sys.stdout)
console.set_name(_APP_HANDLER_NAME)
console.setFormatter(_json_formatter())
root.addHandler(console)
```

Este trabajo nos dejó con menos alertas, pero más importante aún, con alertas que podemos explicar, probar y usar.
