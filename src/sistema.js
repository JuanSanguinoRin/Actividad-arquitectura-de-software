import { CONFIG } from './config.js';
import { crearBd } from './bd.js';
import { crearRepositorioSillas } from './sillas/repositorio-sillas.js';
import { crearOrdenes } from './ventas/ordenes.js';
import { crearOutbox } from './outbox/outbox.js';
import { crearPasarelaSimulada } from './pagos/pasarela-simulada.js';
import { crearCheckout } from './ventas/checkout.js';

// Arma el camino del escenario. `modoPasarela` es la bandera que reproduce la
// falla: "normal" o "doble" (la pasarela confirma por respuesta y por webhook).
export function crearSistema({ modoPasarela = 'normal', sillasExtra = 0, config = CONFIG } = {}) {
  const bd = crearBd({ latenciaBdMs: config.latenciaBdMs });
  const sillas = crearRepositorioSillas({ bd });
  // (S) Precio de ejemplo; el caso no fija precios.
  sillas.sembrar([
    { id: 'H-14', precio: 180000 },
    ...Array.from({ length: sillasExtra }, (_, i) => ({ id: `S-${i + 1}`, precio: 180000 })),
  ]);
  const ordenes = crearOrdenes({ bd });
  const outbox = crearOutbox({ bd });
  const pasarela = crearPasarelaSimulada({ modo: modoPasarela, latenciaMs: config.pasarelaLatenciaMs });
  const checkout = crearCheckout({ sillas, ordenes, pasarela, outbox, config });
  return { checkout, sillas, ordenes, outbox, pasarela, bd, config };
}
