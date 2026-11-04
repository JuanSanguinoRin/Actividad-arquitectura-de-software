# ADR-002: Un modelo de lenguaje clasifica los comentarios de los asistentes después del evento; las reglas y una persona deciden los casos críticos

Estado: propuesto

## Contexto y fuerzas

El caso vende boletería "en estadios y arenas de la región", y cuando algo sale mal los fans culpan a la empresa. El tablero del organizador (RF-08 del caso, RF-17 en `requisitos.md`) muestra ventas y aforo, pero no lo que vivió el asistente: seguridad, filas, servicios, precio. Esa experiencia llega como texto libre, y nadie alcanza a leerla completa.

**Supuestos nuevos (no están en el caso ni en los requisitos):**

- **(S)** Existe un módulo Opiniones que recibe comentarios de los asistentes después del evento.
- **(S)** Responde el 10 % de los 15.000 asistentes: unos 1.500 comentarios por evento.
- **(S)** "Asistente verificado" significa tener una boleta emitida para ese evento, dato que ya existe. No depende de la lectura en puerta.
- **(S)** El revisor de los casos críticos es una persona del equipo del organizador.

**Punto del sistema:** módulo Opiniones, ejecutado por el worker interno (ADR-001) **después del evento**, nunca durante la ventana de venta. No toca la fila (< 3 s), las sillas, el cobro (pasarela de 2 a 10 s) ni la puerta (< 1 s). Esto respeta RNF-16: los reportes no degradan el flujo de compra.

**Patrones:** guardrails en la entrada y la salida, y human-in-the-loop para los casos críticos y RAG sobre las fichas para recuperar los comentarios que sustentan la respuesta.

**Fuerzas:**

- **Gravedad de un error:** perder un comentario crítico (una baranda floja) es un riesgo físico para hasta 15.000 personas. Contar mal un tema es reversible.
- **Costo por llamada:** el modelo trabaja por evento (unos 30 lotes de 50 comentarios), nunca por cada uno de los 120.000 compradores. Estimación de entrada: 1.500 comentarios × ~150 tokens = 225.000 tokens **(S)**, sin contar la instrucción, la salida ni los reintentos. La tarifa del proveedor no está definida.
- **Tiempo de espera:** el análisis es asíncrono y se mide en horas, no en segundos. No compite con ninguna latencia del caso.
- **Datos que recibe el modelo:** los comentarios pueden traer nombres, cédulas y datos de salud (Ley 1581 de 2012, RNF-12). Se enmascaran antes de enviar y se declaran los límites (ver Consecuencias).
- **Abuso:** bots y reventa, el enemigo número uno del caso, pueden inundar los comentarios. Solo cuentan cuentas con boleta emitida, con un máximo de 3 comentarios por evento.
- **Sin modelo de lenguaje:** un menú de categorías y una lista de palabras críticas resuelven una parte (ver comparación abajo).

| | Menú de categorías + lista de palabras críticas (sin modelo) | Con modelo de lenguaje |
|---|---|---|
| Qué clasifica | La categoría que el asistente elige y las palabras de la lista | También el comentario de texto libre sin categoría elegida, con subtema y lugar |
| Cómo falla | De forma visible: categoría vacía o palabra no encontrada | Con una ficha válida pero falsa, sin ningún error |
| Costo | Sin costo por llamada | Por token y por reintento |
| Prueba | Pasa o no pasa | Casos con umbral |

## Decisión

El modelo convierte cada comentario en fichas (categoría, lugar, severidad y cita). El código valida y cuenta. Una persona decide lo crítico. El modelo nunca ejecuta acciones.

1. **Entrada (código):** solo cuentas con boleta emitida, 3 comentarios como máximo, se enmascaran datos personales y se descartan spam y duplicados.
2. **Red de críticos (reglas, sin modelo):** una lista de palabras (baranda, herido, desmayo, incendio, robo...) revisa todos los comentarios, normalizando tildes y mayúsculas.
3. **Extracción (modelo):** lotes de 50 comentarios, sin herramientas, timeout de 60 s. Una ficha por tema. Categorías (S): Seguridad y estructura, Acceso y filas, Comodidad y servicios, Precio y cobro, Evento y artista.
4. **Salida (código):** la categoría debe estar en el catálogo, la cita debe aparecer literal en el comentario, y la severidad final es **la más alta entre la del modelo y la de las reglas**.
5. **Revisión humana:** todo posible crítico va a la cola de revisión del organizador. Si confirma, se abre un tema crítico. Si descarta, escribe un motivo que queda registrado.

**Vista de contenedores:** el proveedor del modelo es un sistema externo. El worker lo llama por HTTPS, de forma asíncrona, con timeout de 60 s. (Pendiente en `contenedores.dsl`.)

## Alternativas descartadas

1. **Sin modelo de lenguaje** (menú, lista de palabras críticas y cola de revisión). Se adopta como línea base y como respaldo cuando el proveedor falla. Se descarta como única solución porque solo clasifica lo que el asistente eligió o lo que la lista prevé. Cuánto gana el modelo frente a esta opción se mide en la Prueba 2.
2. **Resumen libre de todos los comentarios.** El modelo puede inventar cifras y nombrar los temas distinto en cada evento, lo que impide comparar eventos.
3. **Que el modelo actúe solo.** Descartar un crítico por error es barato de hacer y muy caro si estaba mal.
4. **Modelo en servidor propio.** El caso dice que pagar capacidad permanente es inviable: los picos son esporádicos.

## Modo de falla y control

- **Modo de falla:** "la baranda de la tribuna sur se movía" sale clasificado como comodidad, severidad baja, sin ninguna excepción. El segundo modo de falla es que el modelo no responda.
- **Qué lo detecta:** el desacuerdo entre las reglas (marcaron "baranda") y el modelo. Para el segundo modo, el timeout de 60 s.
- **Cómo termina:** el caso llega a la cola del organizador, que abre un tema crítico o lo descarta con motivo escrito. Si el modelo no responde, tras 3 reintentos el lote queda como "análisis atrasado" y se trabaja solo con las reglas.

```mermaid
sequenceDiagram
    participant W as Worker interno
    participant R as Reglas (sin modelo)
    participant M as Proveedor del modelo (externo)
    participant API as API de Boletería
    actor O as Organizador

    W->>R: Comentario "la baranda de la tribuna sur se movía"
    R-->>W: Posible crítico (palabra "baranda")
    W->>M: Extraer fichas del lote de 50 (timeout 60 s)
    alt El modelo responde mal
        M-->>W: Comodidad, severidad baja
        Note over W: DETECTA: desacuerdo entre reglas y modelo
        W->>W: Severidad final = la más alta (crítica, por las reglas)
    else El modelo no responde
        Note over W,M: DETECTA: timeout de 60 s
        W->>M: Reintento (hasta 3)
        W->>W: Lote en "análisis atrasado"; solo reglas
    end
    W->>API: Caso crítico a la cola de revisión
    API->>O: Muestra el caso
    alt Confirma
        O->>API: Abre tema crítico (visible hasta cerrarlo)
    else Descarta
        O->>API: Motivo escrito (queda registrado)
    end
```

**Otras fallas:**

| Falla | Control |
|---|---|
| Cita inventada | El validador la bloquea: debe aparecer literal en el comentario. |
| Categoría fuera del catálogo | Se rechaza la ficha. |
| Instrucciones dentro de un comentario | El modelo no tiene herramientas ni ejecuta acciones. El comentario se envía como dato delimitado. |
| Proveedor caído | Reintentos y aviso de "análisis atrasado". |

## Cómo se mide que funciona

Son dos pruebas, porque un adaptador simulado no puede medir el acierto de un modelo real.

**Prueba 1: reglas, validadores y escalamiento (con adaptador simulado del modelo).**
- **Casos:** 200 comentarios sintéticos **(S)**, de los cuales 30 son críticos (10 sin ninguna palabra de la lista) y 10 son trampas ("precios de robo", "no hubo heridos").
- **Mínimo:** los 30 críticos con señal de las reglas o del modelo llegan a la cola (30 de 30). Al menos 8 de las 10 trampas no abren un caso crítico **(S)**: umbral inicial que se ajusta con datos reales.
- **Por qué 30 críticos:** con 30 de 30, el acierto real es de al menos ~90 % con 95 % de confianza. Con 10 de 10 solo se garantizaría ~74 %.
- **Cómo se ejecuta:** con un solo comando, cada vez que cambien las reglas, el catálogo o el prompt.

**Prueba 2: categorías con modelo real.**
- **Casos:** 100 comentarios etiquetados por dos integrantes.
- **Mínimo:** 85 % de categorías correctas **(S)**, valor inicial que se ajusta al acuerdo entre los dos etiquetadores. Además, el modelo debe superar al menú y la lista en la misma muestra.
- **Si no se conecta un proveedor real en esta entrega**, esta prueba se declara no medida.

## Consecuencias

- **Ventaja:** problemas recurrentes con evidencia, sin perder un comentario crítico, y con la cola de revisión como último control.
- **Costo:** ~225.000 tokens de entrada por evento **(S)**, un proveedor externo con acuerdo de datos, y tiempo del organizador para revisar críticos y una muestra de 50 fichas por evento.
- **Nuevas fallas posibles:**
  - Un crítico sin palabra de la lista y que el modelo tampoco marque.
  - Fatiga del revisor por falsos positivos.
  - Datos personales (nombres y salud) que el enmascarado no atrape. Si el titular lo pide, se borra su ficha.
- **Señal que nos haría cambiar de opinión:** más del 30 % de las fichas de la muestra corregidas en 3 eventos seguidos **(S)**, o la lista de palabras atrapando casi todos los críticos y dejando al modelo sin aporte.

## Trabajo futuro (fuera de esta decisión)

Preguntas del organizador al modelo (tool-calling), las 13 categorías originales, la clasificación por recinto/evento/puntual, la categoría emergente y la segunda revisión con otra persona.