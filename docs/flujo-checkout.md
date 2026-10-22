# Flujo: Comprar con silla específica

**Caso 5 — Sistema de Boletería de Eventos**  
Universidad Francisco de Paula Santander · Arquitectura de Software · 2026

---

## Paso 1 — Lista de pasos del flujo

Flujo seleccionado: **checkout de una entrada con silla numerada**, desde que el comprador selecciona la silla hasta que el tablero de ventas refleja la venta.

1. **Comprador selecciona silla en el mapa y el sistema bloquea el asiento** — reserva temporal con temporizador de expiración. 
2. **Sistema cobra a través de la pasarela de pagos** — petición síncrona con los datos de la orden; espera resultado. 
3. **Sistema emite la boleta digital con código QR nominal** — genera el artefacto único e intransferible vinculado a la silla y al comprador. 
4. **Sistema notifica al comprador** — envía el QR por correo y por notificación push en la app.
5. **Sistema actualiza el tablero de ventas y el aforo disponible** — registra la silla como vendida y refleja la capacidad ocupada en tiempo real para el organizador y las autoridades.



## Paso 2 — Decisión paso por paso

|Paso|Quién|Síncrono o asíncrono|Si falla|Si se repite|

1. Bloquear silla|API / Inventario|Síncrono|Se rechaza si ya estaba tomada; condición de carrera resuelta con actualización atómica en BD|Mismo `orden\_id`: no bloquea una segunda vez|
2. Cobrar|API → Pasarela (externo)|Síncrono, timeout \~15s|Se libera el bloqueo de la silla|Mismo `orden\_id` como `Idempotency-Key`: no cobra dos veces|
3. Emitir QR|Worker interno|Asíncrono (cola interna)|Reintentos con backoff; alerta manual si persiste|Verifica `orden\_id` antes de emitir: no duplica boleta|
4. Notificar|Worker interno → correo/push|Asíncrono, en paralelo al paso 5|Reintentos con backoff; boleta ya visible en la app|Idempotencia suave: evita reenvío innecesario|
5. Actualizar tablero/aforo|Worker interno|Asíncrono, en paralelo al paso 4|Tablero se atrasa; alerta si supera un umbral|Mismo `orden\_id`: no duplica el conteo del aforo|
