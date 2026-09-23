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



