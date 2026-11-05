# Actividad-arquitectura-de-software
## Link del repo: https://github.com/JuanSanguinoRin/Actividad-arquitectura-de-software
## Integrantes:
### Angely Sofia Pino Gonzalez - 1152315
### Juan Sebastián Sanguino Rincón - 1152323
### Laura Alejandra Caballero Prada - 1152322
### David Santiago Rincón - 1152327
### Juan David Mendoza Ropero - 1152295
### Nicolas Felipe Meneses Peinado - 1152304

## Escenario elegido

**Consistencia del asiento: cada silla se vende una sola vez** (RNF-05, escenario 3). La demanda del caso dice: *"El asiento H-14 no puede venderse dos veces, ni quedar bloqueado para siempre por un carrito abandonado"*.

**Por qué este y no la fila virtual (P4), que es la tensión principal de `vision.md`.** Una doble venta es el único error irreversible del caso: *"no se puede corregir el día del evento"* (ADR-000). Además, su falla vive en el código del monolito y se reproduce con una prueba automatizada en segundos. Los otros escenarios no permiten eso:

- La fila (< 3 s en el p95 con 120.000 compradores) depende de la infraestructura de borde.
- La puerta (< 1 s sin red, P5) depende del lector Android, que no está implementado.

**Medida:** 200 intentos simultáneos de comprar H-14, con la pasarela confirmando dos veces, deben dejar exactamente **1 venta, 1 cobro y 199 rechazados en 100 de 100 repeticiones**.

**Táctica:** bloqueo atómico con vencimiento, más idempotencia con `orden_id`.

El detalle, el costo medido y las alternativas descartadas están en [ADR-003](docs/adr/ADR-003-Tactica-del-Escenario.md).

## Cómo ejecutar la prueba

Requisito: Node.js 20 o superior. No hay dependencias que instalar.

**Con la falla** (200 intentos sobre H-14, la pasarela confirma por la respuesta y por el webhook, el bloqueo vence y el pago se rechaza):

```bash
npm run escenario:con-falla
```

**Sin la falla** (un comprador con la pasarela normal):

```bash
npm run escenario:sin-falla
```

Otros comandos:

- `npm test` corre las 4 pruebas.
- `npm run costo` mide el costo de la táctica (latencia, consultas a la BD y líneas de código).

**Evidencia en el historial de commits:**

| Commit | Estado | Resultado de `npm run escenario:con-falla` |
|---|---|---|
| `7cc38f2` | Sin táctica | Fallan 2 de 3 pruebas: 200 ventas y 200 cobros |
| `d49b220` | Táctica 1: bloqueo atómico con vencimiento | Falla 1 de 3: 0 ventas y 1 cobro |
| `86aac9c` | Táctica 2: idempotencia con `orden_id` | Pasan las 3 |

## Documentos

- [ADR-000: visión arquitectónica](docs/adr/ADR-000.md)
- [ADR-001: outbox y worker interno](docs/adr/ADR-001-Cola-Interna.md)
- [ADR-002: modelo de lenguaje para las opiniones de los asistentes](docs/adr/ADR-002-Modelo-de-Lenguaje.md)
- [ADR-003: táctica del escenario](docs/adr/ADR-003-Tactica-del-Escenario.md)
- [Vista de contenedores](docs/contenedores.dsl) ([imagen](docs/contenedores.png))
- [Visión del sistema](docs/vision.md), [requisitos](docs/requisitos.md) y [flujo del checkout](docs/flujo-checkout.md)

## Video de sustentación

PENDIENTE: enlace de YouTube (video oculto)

## Quién hizo qué

| Integrante | Aporte | Parte del video |
|---|---|---|
| Angely Sofia Pino Gonzalez | ADR-000, ADR-001, visión del sistema y requisitos | PENDIENTE |
| Juan Sebastián Sanguino Rincón | Táctica 1: bloqueo atómico con vencimiento (`src/sillas/repositorio-sillas.js`) | PENDIENTE |
| Laura Alejandra Caballero Prada | Táctica 2: idempotencia con `orden_id` (`src/ventas/checkout.js`, `src/ventas/ordenes.js`) y flujo del checkout | PENDIENTE |
| David Santiago Rincón | ADR-002: modelo de lenguaje | PENDIENTE |
| Juan David Mendoza Ropero | Estructura del proyecto, camino sin táctica, pasarela simulada y prueba del escenario que falla | PENDIENTE |
| Nicolas Felipe Meneses Peinado | ADR-003 y vista de contenedores | PENDIENTE |
