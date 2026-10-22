# Requisitos del sistema de boletería de eventos

Requisitos derivados de [vision.md](vision.md) (preguntas 1 a 7) y del [ADR-000](adr/ADR-000.md).

**Convenciones:**

- ★ = función esencial según la Pregunta 2.
- **(S)** = supuesto del equipo; no aparece explícito en los documentos fuente y debe confirmarse.

> Los documentos fuente mencionan RF-05 (transferencia) y RF-08 (tablero del organizador) con la numeración del enunciado original del caso. La numeración de este documento es propia y debe alinearse con ese enunciado.

## Requisitos funcionales

| ID | Requisito | Actor | ★ |
|---|---|---|---|
| RF-01 | Autenticar al comprador (registro e inicio de sesión) | Comprador | |
| RF-02 | Configurar un evento: plano del recinto, localidades, precios, aforo máximo, políticas de venta y límite de boletas por persona | Organizador | ★ |
| RF-03 | Mostrar el catálogo de eventos y buscar por criterios | Comprador | |
| RF-04 | Poner a los compradores en una fila virtual, mostrarles su posición y el tiempo estimado de espera, y dejarlos pasar a la compra al ritmo que aguanta el backend | Comprador | ★ |
| RF-05 | Filtrar el tráfico de bots con desafíos antes de la selección de asiento | Sistema / Comprador | ★ |
| RF-06 | Mostrar el mapa de asientos con disponibilidad y precios en tiempo real | Comprador | ★ |
| RF-07 | Bloquear el asiento elegido con un temporizador visible y liberarlo si expira o si falla el pago | Comprador | ★ |
| RF-08 | Hacer cumplir el límite de boletas por persona en cada evento | Sistema | |
| RF-09 | Cobrar por la pasarela: orden con ID único, desglose de tarifas y desafío 3-D Secure | Comprador, Pasarela de pagos | ★ |
| RF-10 | Conciliar los pagos con los webhooks asíncronos de la pasarela | Pasarela de pagos | |
| RF-11 | Emitir un QR nominal único por silla y entregarlo por la app y por correo, de forma asíncrona y por cola | Comprador | ★ |
| RF-12 | Transferir una boleta a otro receptor e invalidar el QR anterior | Comprador | |
| RF-13 | Validar el QR en la puerta con 5 respuestas posibles: Aprobado, Denegado, Ya ingresado, Revocada o Localidad incorrecta | Personal de puerta | ★ |
| RF-14 | Validar sin red usando un padrón local, guardar los resultados en cola y sincronizarlos cuando vuelva la conexión | Personal de puerta | ★ |
| RF-15 | Alertar cuando alguien intente reusar una boleta o cometer fraude en la puerta | Personal de puerta | |
| RF-16 | Registrar incidentes de acceso o contingencias de forma manual | Personal de puerta | |
| RF-17 | Mostrar al organizador un tablero en tiempo real: velocidad de venta, boletas vendidas por localidad, recaudo y ocupación | Organizador | |
| RF-18 | Generar informes y certificados de aforo vendido y aforo en sala, cumplimiento por localidad y atención de auditorías | Autoridades locales | |

## Requisitos no funcionales

| ID | Atributo | Requisito medible | Fuente |
|---|---|---|---|
| RNF-01 | Escalabilidad elástica | Atender **120.000 compradores concurrentes** para 15.000 entradas (demanda 8:1) y crecer solo en los picos, sin pagar esa capacidad el resto del año | P4, ADR-000 |
| RNF-02 | Disponibilidad | **≥ 99,9 %** durante los primeros 10 minutos de cada venta | P4 |
| RNF-03 | Desempeño en la fila | Confirmar la entrada a la fila virtual en **< 3 s** por solicitud | P4 |
| RNF-04 | Seguridad anti-bot | Bloquear **≥ 95 %** del tráfico de bots antes de la selección de asiento | P4 |
| RNF-05 | Consistencia | **0 asientos vendidos dos veces.** En la compra, la consistencia pesa más que la disponibilidad | ADR-000, P7 |
| RNF-06 | Tolerancia a fallos de la pasarela | Usar un timeout acorde a la latencia de la pasarela (2–10 s). Si falla, no confirmar la venta y liberar la silla, sin dejar ventas a medias | P7 |
| RNF-07 | Durabilidad de la emisión | No perder ningún mensaje de emisión. Si la cola o su consumidor se caen, la entrega se demora pero la venta no se pierde | P7 |
| RNF-08 | Desempeño en la puerta | Validar en **< 1 s** el 100 % de los casos, incluso con 0 % de conectividad. Throughput de **20.000 ingresos por hora** | P5 |
| RNF-09 | Frescura del padrón | El lector conoce las invalidaciones de hasta **5 minutos** antes de perder la red. En la puerta, la disponibilidad pesa más que la consistencia estricta | P5, ADR-000 |
| RNF-10 | Integridad del QR **(S)** | El QR va firmado o cifrado para que no se pueda falsificar y se pueda verificar offline | P1, P5 |
| RNF-11 | Seguridad de pagos **(S)** | Cumplir PCI-DSS sin guardar datos de tarjeta, con 3-D Secure obligatorio | P1 |
| RNF-12 | Privacidad **(S)** | Tratar los datos personales según la Ley 1581 de 2012 (habeas data en Colombia) | — |
| RNF-13 | Equidad **(S)** | Dejar pasar a la compra en orden FIFO verificable, sin saltos | P2 |
| RNF-14 | Auditabilidad | Llevar trazabilidad completa de ventas, transferencias e ingresos para los reportes regulatorios | P1, ADR-000 |
| RNF-15 | Modificabilidad | Monolito modular con fronteras claras (fila, bloqueo, pago, emisión, validación) que permita extraer servicios después | P6 |
| RNF-16 | Aislamiento del camino crítico **(S)** | Los reportes y el tablero no deben degradar el flujo de compra (por ejemplo, leyendo de una réplica) | P6 (trade-off) |
| RNF-17 | Observabilidad **(S)** | Métricas en tiempo real de la fila, la tasa de bloqueos y los pagos para operar la ventana de venta | — |

## Tensiones y huecos

1. **Monolito y escalabilidad (RNF-01 y RNF-15):** la P6 acepta que no se puede escalar la fila por separado. Para la v1 hay que decidir si la fila virtual queda dentro del monolito o como componente de borde (CDN o sala de espera administrada).
2. **Consistencia y disponibilidad en distintos lugares (RNF-05 y RNF-09):** la arquitectura debe dejar explícito que en la compra manda la consistencia y en la puerta la disponibilidad.
3. **Datos que faltan:**
   - cuánto dura el bloqueo del asiento;
   - cuántas puertas y lectores hay (20.000 por hora son unas 5,6 validaciones por segundo en total);
   - cuántas compras por segundo debe confirmar el checkout;
   - hasta cuándo se permite transferir antes del evento (afecta la ventana de 5 minutos de RNF-09);
   - cada cuánto se refresca el tablero.
