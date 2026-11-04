import { conTimeout } from '../util.js';

// Camino del escenario en la vista de contenedores:
// comprador → API de Boletería (este módulo) → base de datos (sillas, órdenes,
// outbox) → pasarela de pagos. Pasos 1 y 2 síncronos y paso 3 por outbox (ADR-001).
//
// VERSIÓN INICIAL, SIN TÁCTICA: lee la silla y la escribe en otra consulta,
// el bloqueo no vence y nada es idempotente.
export function crearCheckout({ sillas, ordenes, pasarela, outbox, config }) {
  async function bloquear(sillaId, compradorId) {
    const silla = await sillas.obtener(sillaId);
    if (!silla || silla.estado !== 'libre') return { ok: false, motivo: 'silla no disponible' };
    const orden = await ordenes.crear({ id: ordenes.nuevoId(), sillaId, compradorId, monto: silla.precio });
    await sillas.guardar({ ...silla, estado: 'bloqueada', ordenId: orden.id });
    return { ok: true, ordenId: orden.id };
  }

  async function pagar(ordenId) {
    const orden = await ordenes.obtener(ordenId);
    let respuesta;
    try {
      respuesta = await conTimeout(
        pasarela.cobrar({ monto: orden.monto, referencia: ordenId }),
        config.timeoutPasarelaMs,
      );
    } catch {
      respuesta = { estado: 'sin respuesta' };
    }
    if (respuesta.estado !== 'aprobado') {
      const silla = await sillas.obtener(orden.sillaId);
      await sillas.guardar({ ...silla, estado: 'libre', ordenId: null });
      await ordenes.actualizar(ordenId, { estado: 'rechazada' });
      return { ok: false, motivo: respuesta.estado };
    }
    await confirmarPago({ ordenId, transaccionId: respuesta.transaccionId });
    return { ok: true };
  }

  // La llaman la respuesta de la pasarela y también su webhook de conciliación (RF-10).
  async function confirmarPago({ ordenId, transaccionId }) {
    const orden = await ordenes.obtener(ordenId);
    const silla = await sillas.obtener(orden.sillaId);
    await sillas.guardar({ ...silla, estado: 'vendida', ordenId });
    await ordenes.actualizar(ordenId, { estado: 'pagada', transaccionId });
    await outbox.agregar({ tipo: 'emitirQR', ordenId, sillaId: orden.sillaId });
  }

  pasarela.alRecibirConfirmacion(confirmarPago);
  return { bloquear, pagar, confirmarPago };
}
