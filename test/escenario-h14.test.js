import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearSistema } from '../src/sistema.js';
import { dormir } from '../src/util.js';
import { MS_POR_SEGUNDO } from '../src/config.js';

// ESCENARIO 3: consistencia del asiento (cada silla, una sola vez).
// Estímulo: 200 intentos simultáneos de bloquear y pagar la silla H-14, con la
// pasarela devolviendo la confirmación dos veces.
// Medida: en 100 repeticiones de la prueba, exactamente 1 venta y 1 cobro sobre
// H-14 en el 100 % de las repeticiones (0 dobles ventas y 0 dobles cobros).
//
// Origen de cada número:
// - 0 dobles ventas: RNF-05 y el caso ("el asiento H-14 no puede venderse dos veces").
// - 1 cobro por silla: idempotencia con orden_id (flujo-checkout.md, paso 2).
// - 200 intentos (S): 120.000 / 15.000 = 8 compradores por silla en promedio;
//   una silla de primera fila recibe muchos más. 200 es 25 veces el promedio.
// - 100 repeticiones (S): una sola corrida puede pasar por azar aunque haya
//   una condición de carrera.
// - Ventana: cada corrida ocurre dentro del bloqueo de 10 minutos (S, requisitos.md).
const INTENTOS = 200;
const REPETICIONES = 100;
const SILLA = 'H-14';

function resumen(sistema) {
  const ordenes = sistema.ordenes.listar().filter((o) => o.sillaId === SILLA);
  const idsOrdenes = new Set(ordenes.map((o) => o.id));
  return {
    ventas: ordenes.filter((o) => o.estado === 'pagada').length,
    cobros: sistema.pasarela.cobrosEfectivos().filter((c) => idsOrdenes.has(c.referencia)).length,
  };
}

async function unaCorrida() {
  const sistema = crearSistema({ modoPasarela: 'doble' });
  let rechazados = 0;
  await Promise.all(
    Array.from({ length: INTENTOS }, async (_, i) => {
      const bloqueo = await sistema.checkout.bloquear(SILLA, `comprador-${i}`);
      if (!bloqueo.ok) {
        rechazados++;
        return;
      }
      await sistema.checkout.pagar(bloqueo.ordenId);
    }),
  );
  await sistema.pasarela.esperarWebhooks();
  return { ...resumen(sistema), rechazados };
}

test('con falla: 200 intentos sobre H-14 con la pasarela confirmando dos veces dejan 1 venta y 1 cobro en 100 de 100 repeticiones', async () => {
  const esperado = { ventas: 1, cobros: 1, rechazados: INTENTOS - 1 };
  const fallidas = [];
  for (let r = 1; r <= REPETICIONES; r++) {
    const obtenido = await unaCorrida();
    const ok = obtenido.ventas === esperado.ventas
      && obtenido.cobros === esperado.cobros
      && obtenido.rechazados === esperado.rechazados;
    if (!ok) fallidas.push({ repeticion: r, ...obtenido });
  }
  assert.equal(
    fallidas.length, 0,
    `${fallidas.length} de ${REPETICIONES} repeticiones fallaron. Primera: ${JSON.stringify(fallidas[0])}. ` +
    `Esperado en cada una: ${JSON.stringify(esperado)}`,
  );
});

test('con falla: si el bloqueo expira sin pago, H-14 vuelve a estar disponible', async () => {
  const sistema = crearSistema();

  const abandonado = await sistema.checkout.bloquear(SILLA, 'comprador-que-no-paga');
  assert.ok(abandonado.ok);
  await dormir(sistema.config.bloqueoMs + 10 * MS_POR_SEGUNDO);

  const segundo = await sistema.checkout.bloquear(SILLA, 'comprador-2');
  assert.ok(segundo.ok, 'H-14 sigue bloqueada después de los 10 minutos');
});

test('con falla: si el pago falla, H-14 vuelve a estar disponible', async () => {
  const sistema = crearSistema({ modoPasarela: 'rechazo' });

  const primero = await sistema.checkout.bloquear(SILLA, 'comprador-rechazado');
  const pago = await sistema.checkout.pagar(primero.ordenId);
  assert.equal(pago.ok, false);

  const segundo = await sistema.checkout.bloquear(SILLA, 'comprador-2');
  assert.ok(segundo.ok, 'H-14 sigue bloqueada después de un pago rechazado');
  assert.equal(resumen(sistema).cobros, 0);
});

test('sin falla: un comprador con la pasarela normal deja 1 venta y 1 cobro', async () => {
  const sistema = crearSistema({ modoPasarela: 'normal' });

  const bloqueo = await sistema.checkout.bloquear(SILLA, 'comprador-1');
  await sistema.checkout.pagar(bloqueo.ordenId);
  await sistema.pasarela.esperarWebhooks();

  assert.deepEqual(resumen(sistema), { ventas: 1, cobros: 1 });
});
