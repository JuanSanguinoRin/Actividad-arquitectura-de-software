Universidad Francisco de Paula Santander

Ingeniería de sistemas

2026

# **CASO 5**

**PRESENTADO POR:** 

[ANGELY SOFIA PINO GONZALEZ](mailto:angelysofiapg@ufps.edu.co)\- 1152315

LAURA ALEJANDRA CABALLERO PRADA \- 1152322

JUAN SEBASTIÁN SANGUINO RINCÓN \- 1152323

DAVID SANTIAGO RINCON BAUTISTA \- 1152327

JUAN DAVID MENDOZA ROPERO \- 1152295

NICOLAS FELIPE MENESES PEINADO \- 1152304

**DOCENTE:**

DANIEL ANDRÉS ESTEBAN CARRILLO

**Pregunta 1** \- Actores y sus intercambios. Listar los actores del sistema del caso — personas y sistemas externos — y, para cada uno, qué información intercambia con el sistema: qué le entrega y qué recibe. Un actor sin intercambio de información no es un actor del sistema. 

**Comprador (Actor humano):**

* **Entrega al sistema:** Credenciales de autenticación; criterios de búsqueda de eventos; selección de localidad y asiento específico en el mapa; datos de facturación; solicitud de reserva/bloqueo temporal; y datos del receptor (correo/identificador) en caso de transferir una boleta.  
* **Recibe del sistema:** Catálogo de eventos disponibles; mapa de disponibilidad y precios de asientos en tiempo real; posición y tiempo estimado de espera en la fila virtual; confirmación de bloqueo con temporizador regresivo de expiración; confirmación de cobro; y boleta digital en la app/correo con código QR nominal e intransferible externamente.

**Organizador del evento (Actor humano):**

* **Entrega al sistema:** Configuración completa del evento (plano y distribución de sillas del recinto, localidades, precios, aforo máximo permitido, políticas de venta y límite de boletas por persona).  
* **Recibe del sistema:** Tablero de control analítico en tiempo real (velocidad de ventas, desglose de entradas vendidas por localidad, recaudación acumulada y capacidad ocupada) y reportes consolidados oficiales para entidades reguladoras.

**Personal de puerta (Actor humano / Operador de torniquete):**

* **Entrega al sistema:** Lectura de datos del código QR escaneado desde el lector Android; identificación de puerta/torniquete; y reportes manuales de contingencia o incidentes de acceso.  
* **Recibe del sistema:** Respuesta inmediata de autorización de acceso (Aprobado / Denegado / Ya ingresado / Entrada revocada / Localidad incorrecta); alerta de intentos de fraude o reuso; y actualización periódica del padrón/lista de boletas válidas e invalidadas.

**Pasarela de pagos (Sistema externo):**

* **Entrega al sistema:** Resultado de la transacción financiera (Aprobada, Rechazada, Fondos insuficientes, Error de autenticación); token de validación 3-D Secure; identificador único de transacción bancaria; y webhooks asíncronos de conciliación de pago.  
* **Recibe del sistema:** Petición de cobro con identificador único de orden, monto total consolidado, desglose de tarifas, datos del tarjetahabiente y redirección de sesión para desafío 3-D Secure.

**Autoridades locales (Actor externo institucional):**

* **Entrega al sistema:** Normativas de seguridad, requisitos de control de capacidad y solicitudes de auditoría de aforo.  
* **Recibe del sistema:** Informes formales y certificados de aforo vendido, aforo en sala en tiempo real y cumplimiento de límites de capacidad reglamentarios por localidad.

**Pregunta 2** \- Funciones esenciales. Enumerar las cinco a siete funciones sin las cuales el sistema no existe, con una línea por función: qué hace y para quién. No es la lista completa de requisitos del caso — es la esencia. Si al quitar una función el sistema sigue teniendo sentido, no era esencial.

1. Publicar el evento con mapa de recinto, localidades y precios — para organizador y comprador.  
   Seleccionar asiento con bloqueo temporal — para el comprador; garantiza que la silla no se le escape mientras paga.  
     
2. Cobrar a través de la pasarela de pagos — para el comprador; sin cobro no hay venta.  
   Emitir la entrada como QR nominal único por silla — para el comprador; es el artefacto que representa la venta.  
     
3. Validar la entrada en la puerta, con o sin red — para el personal de puerta; sin esto no hay control de acceso al evento.  
     
4. Ordenar el acceso a la compra con fila virtual cuando la demanda supera la oferta — para el comprador; sin esto el sitio muere en cada lanzamiento, que es el problema de negocio central del caso.  
     
5. Quedan fuera de la esencia: la transferencia de entradas (RF-05) y el tablero del organizador (RF-08) — son valiosas, pero si se quitan, el sistema sigue siendo un sistema de boletería con sentido.

**Pregunta 3** \- Diagrama de contexto (con foto adjunta). Dibujar en papel o tablero el diagrama de contexto (C4 nivel 1): el sistema como una caja negra, los actores y sistemas externos alrededor, y flechas etiquetadas con la información que fluye — sin tecnologías ni módulos internos. Adjuntar la fotografía. En el cuadro de texto, explicar una decisión tomada al dibujarlo: qué quedó por fuera de la frontera del sistema y por qué.  
![][image1]

**Pregunta 4** \- Primer escenario de calidad \- la tensión principal. Tomar la primera «demanda de calidad conocida» del caso y convertirla en un escenario completo de seis partes: fuente, estímulo, artefacto, entorno, respuesta y medida. La medida debe ser un número verificable sin medida no hay escenario.

**Fuente:** 120.000 compradores concurrentes (incluye tráfico de bots de reventa).  
**Estímulo:** se abre la venta de un evento de 15.000 entradas y llegan ráfagas de solicitudes de compra en los primeros minutos.  
**Artefacto:** el módulo de fila virtual / admisión al flujo de compra.  
**Entorno:** operación normal, en los primeros 10 minutos tras la apertura de venta, con demanda 8 veces superior a la oferta.  
**Respuesta:** el sistema admite a los compradores a una fila virtual, los ordena, filtra tráfico no humano con desafíos anti-bot, y libera cupos de compra al ritmo que el backend puede sostener sin degradarse.  
**Medida:** el sistema permanece disponible (≥99.9%) durante toda la ventana de 10 minutos, confirma el ingreso a la fila en menos de 3 segundos por solicitud, y bloquea al menos el 95% del tráfico identificado como bot antes de que llegue a la selección de asiento.

**Pregunta 5** \- Segundo escenario de calidad otro atributo. Redactar un segundo escenario completo sobre un atributo de calidad distinto al anterior (otra de las demandas del caso, o una tensión que el grupo identifique). Mismas seis partes, misma exigencia con la medida.

**Fuente:** personal de puerta con lector Android.  
**Estímulo:** se escanea un código QR en el torniquete durante la hora de mayor afluencia (20.000 personas/hora), con la red del estadio caída o congestionada.  
**Artefacto:** el módulo de validación de entrada en el lector de puerta.  
**Entorno:** operación normal el día del evento, con conectividad degradada o nula.  
**Respuesta:** el lector valida la entrada contra su copia local de entradas válidas/invalidadas, sin depender de una llamada en línea al servidor central, y encola el resultado para sincronizar cuando la red vuelva.  
**Medida:** cada validación se resuelve en menos de 1 segundo en el 100% de los casos, incluso con 0% de conectividad, y el lector refleja las invalidaciones por transferencia ocurridas hasta 5 minutos antes de perder la red.

**Pregunta 6** \- ¿Monolito o distribuido?. Para la primera versión del sistema: ¿un monolito o servicios separados? Justificar con las tensiones del caso, no con preferencias, y declarar explícitamente qué sacrifica la opción elegida. Una decisión sin trade-off declarado no es una decisión.

**Decisión:** monolito modular para la v1.

Los picos son esporádicos (semanas sin ventas, 10 minutos de furia): pagar la complejidad operativa de varios servicios desplegados de forma independiente, cada uno con su propia disponibilidad que mantener 24/7, no se justifica cuando la mayor parte del tiempo no hay tráfico.  
El flujo crítico (bloqueo de silla → pago → emisión) es una transacción que debe ser coherente; coordinarla como una saga distribuida entre servicios añade complejidad (compensaciones, timeouts, estados intermedios) que un monolito con una sola base de datos transaccional resuelve de forma mucho más simple.  
El equipo y el proyecto están en su primera versión: la disciplina de fronteras de módulo (bloqueo de asiento, pago, emisión, validación de puerta) se puede exigir dentro del monolito, dejando la puerta abierta a extraer servicios después si el negocio lo pide.

Trade-off que se sacrifica explícitamente: se pierde la capacidad de escalar de forma independiente hot path (selección de asiento \+ fila virtual) sin escalar todo lo demás, y se pierde aislamiento de fallas entre módulos, un problema en el reporte a autoridades corre en el mismo proceso que el bloqueo de sillas, y un despliegue con un bug afecta a todo el sistema a la vez. Es una decisión reversible a propósito: cara de tomar mal, barata de revertir si el monolito modular está bien encapsulado.

**Pregunta 7** \- Lo síncrono y lo asíncrono del caso. Identificar en el caso una operación que debe ser síncrona (quien la pide necesita el resultado en esa misma respuesta) y una que debería procesarse por una cola de mensajes. Justificar ambas y describir qué ocurre en cada una si el otro extremo está caído en ese momento.

**Síncrono:** el bloqueo de asiento \+ confirmación de cobro en el checkout. El comprador necesita saber, en esa misma respuesta, si consiguió la silla y si el pago fue aceptado de eso depende si sigue en el flujo o intenta otra silla.

Si la pasarela está caída en ese momento: la llamada síncrona falla o expira (la pasarela ya tarda 2-10s y a veces rechaza sin explicación). El sistema no debe confirmar la venta; debe liberar el bloqueo temporal de la silla (o dejarlo expirar) y mostrarle al comprador un estado de "pago no procesado, intenta de nuevo" la silla vuelve al pool disponible, nunca queda vendida a medias.

**Asíncrono (cola):** la emisión y entrega de la entrada (generar el QR, enviarlo por correo y notificación push) una vez confirmado el pago.

Si el consumidor de la cola (el servicio de emisión) está caído: el pago ya se confirmó y la venta es válida; el mensaje de "emitir entrada" queda encolado. El comprador ve "compra confirmada, tu entrada está en camino" en vez de recibir el QR al instante. Cuando el consumidor se recupera, procesa la cola sin pérdida de datos, la caída se convierte en una demora, no en una venta perdida ni en una silla mal asignada.


