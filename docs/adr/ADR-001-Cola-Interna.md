# ADR-000: Qué pasos del checkout van por evento

Estado: borrador

## Decision

Los pasos 1 (bloquear silla) y 2 (cobrar) son sincronos: el comprador necesita la respuesta en esa misma peticion para saber si consiguio la silla y si el pago paso, antes de decidir si sigue en el flujo o intenta otra silla.

Los pasos 3 (emitir el QR), 4 (notificar al comprador) y 5 (actualizar tablero de ventas/aforo) van por evento. En la misma transaccion de base de datos donde se confirma el pago, la API escribe una fila en una tabla de tareas pendientes (outbox). Un worker interno, dentro del mismo monolito, la revisa periodicamente y ejecuta esas tres tareas.

## Alternativa descartada

Hacer todo sincrono. Habriamos ganado la certeza de que el comprador ve su QR y su correo en el mismo instante en que paga, sin necesidad de outbox ni worker. A cambio, el checkout completo habria tardado lo que tarde el paso mas lento de los cinco — el proveedor de correo, un tercero que ya tarda 2-10s y a veces esta lento o caido — y una caida de ese proveedor habria tumbado la venta completa aunque el pago ya estuviera cobrado. Eso es justo lo que el caso no tolera: 120.000 compradores concurrentes contra 15.000 sillas en los primeros minutos de venta (demanda 8 a 1, EC-01), donde cada segundo de mas en el checkout cuesta ventas que no vuelven.

## Consecuencia negativa

Consistencia eventual entre el pago y la boleta visible: el comprador ve "pago confirmado, tu entrada esta en camino" antes de tener el QR en mano, nunca en el mismo instante que la confirmacion del pago.

Cada paso asincrono tiene que ser idempotente usando el mismo `orden_id` generado al inicio del checkout: antes de emitir el QR, notificar, o sumar la venta al tablero, el worker pregunta "¿esto ya se hizo para este orden_id?" — y esa marca de "ya procesado" hay que persistirla en la base de datos, porque el procesamiento de la tabla de tareas puede reintentarse ante una caida parcial del worker (por ejemplo, si se cae justo antes de marcar una tarea como completada) y no debe duplicar boletas ni inflar el aforo reportado a las autoridades.

## Señal que nos haria cambiar de opinion

Si el volumen de tareas pendientes empieza a generar contencion sobre la misma base de datos que soporta el bloqueo de sillas y el cobro — el camino mas critico del sistema — es momento de sacar el worker a un proceso separado con su propia cola externa.
