# ADR-003: <la táctica aplicada, en una línea>

Estado: propuesto

<!--
Parte B del segundo previo. Se toma UN solo escenario de calidad, se escribe una
prueba automatizada que falla, se aplica una táctica (máximo dos) hasta que pase y
se registra su costo con datos. Este ADR documenta esa táctica.
Borrar estos comentarios al terminar.
-->

## Contexto

**Escenario elegido:** [PENDIENTE: nombre del escenario, por ejemplo "cada silla se vende una sola vez" (RNF-05)]

**Por qué este y no los otros:** [PENDIENTE: dato del caso que lo sustenta y comparación con los escenarios descartados (fila virtual < 3 s p95, puerta < 1 s)]

**Medida del escenario (número, origen y ventana):**

- Número: [PENDIENTE: por ejemplo "exactamente 1 venta y 1 cobro"]
- Origen del número: [PENDIENTE: de qué documento sale: caso, ADR-000, RNF-xx o supuesto del equipo (S)]
- Ventana de tiempo: [PENDIENTE: en qué intervalo se mide]

**Camino en la vista de contenedores:** 

![ ](contenedores-c4-camino-del-escenario-3-consistencia-del-asiento-diagrama.webp)

**Falla reproducible:** [PENDIENTE: qué falla se provoca y con qué mecanismo del código: variable de entorno, bandera o adaptador simulado de la pasarela]

**Resultado de la prueba sin la táctica:** [PENDIENTE: qué falló y con qué números, por ejemplo "de 200 intentos concurrentes sobre la silla B-14 se registraron N ventas y M cobros"]

## Decisión

[PENDIENTE: la táctica aplicada (máximo dos), qué se cambió en el código y por qué corresponde al modo de falla. Explicarla desde el código, no solo con su nombre]

- Archivos modificados: [PENDIENTE: rutas en `src/`]
- Líneas de código agregadas: [PENDIENTE: número]

## Alternativas descartadas

<!-- Cada una con su razón, usando datos del caso. -->

1. **[PENDIENTE: alternativa, por ejemplo una cola de mensajes en vez de bloqueo con vencimiento]:** [PENDIENTE: razón con datos del caso, como 10.000 solicitudes por segundo en el pico, pasarela de 2 a 10 s o timeout de 15 s]
2. **[PENDIENTE: otra alternativa]:** [PENDIENTE: razón]

## Ventaja

- [PENDIENTE: qué mejora la táctica, con número, por ejemplo "de N ventas duplicadas a 0 en 200 intentos concurrentes"]

## Costo

<!-- Con mediciones de antes y después. "Quedó un poco más lento" no cuenta. -->

| Medición | Antes de la táctica | Después de la táctica |
|---|---|---|
| Latencia de [PENDIENTE: operación medida, por ejemplo reservar] (ms, p95) | [PENDIENTE] | [PENDIENTE] |
| Líneas de código del camino | [PENDIENTE] | [PENDIENTE] |
| Resultado de la prueba del escenario | falla | pasa |

- **Nueva falla posible:** [PENDIENTE: estado o caso que antes no existía y ahora hay que manejar, por ejemplo "pago en verificación"]
- **Complejidad agregada:** [PENDIENTE]

## Cómo se verifica que funciona

- **Prueba del escenario:** [PENDIENTE: ruta del archivo en `test/`]
- **Condición de éxito:** [PENDIENTE: la medida del escenario, con número y ventana]
- **Con la falla activada (debe fallar sin la táctica y pasar con ella):** [PENDIENTE: comando, por ejemplo `npm run escenario`]
- **Sin la falla (camino normal):** [PENDIENTE: comando, por ejemplo `npm test`]
- **Evidencia en el historial de commits:** [PENDIENTE: hash del commit donde la prueba existía y fallaba, y hash del commit donde se aplicó la táctica]

## Señal que nos haría cambiar de opinión

- [PENDIENTE: dato que haría reconsiderar la táctica, por ejemplo "si la latencia p95 de reservar supera X ms con 120.000 compradores concurrentes"]
