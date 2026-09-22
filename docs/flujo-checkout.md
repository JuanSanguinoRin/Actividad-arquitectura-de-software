# Flujo: Comprar con silla específica

**Caso 5 — Sistema de Boletería de Eventos**  
Universidad Francisco de Paula Santander · Arquitectura de Software · 2026

---

## Paso 1 — Lista de pasos del flujo

Flujo seleccionado: **checkout de una entrada con silla numerada**, desde que el comprador decide comprar hasta que tiene su boleta en mano.

1. **Comprador solicita entrar a la fila virtual** — el sistema lo admite, le asigna posición y le muestra tiempo estimado de espera. (Módulo de fila virtual)
2. **Comprador selecciona silla en el mapa y el sistema bloquea el asiento** — reserva temporal con temporizador de expiración. (Módulo de inventario)
3. **Sistema cobra a través de la pasarela de pagos** — petición síncrona con los datos de la orden; espera resultado. (Módulo de pagos ↔ Pasarela externa)
4. **Sistema emite la boleta digital con código QR nominal** — genera el artefacto único e intransferible vinculado a la silla y al comprador. (Módulo de emisión)
5. **Sistema notifica al comprador** — envía el QR por correo y por notificación push en la app. (Módulo de notificaciones ↔ Proveedor de correo)



