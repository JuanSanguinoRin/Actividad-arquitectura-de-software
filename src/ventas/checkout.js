import { conTimeout } from '../util.js';

// Camino del escenario en la vista de contenedores:
// comprador → API de Boletería (este módulo) → base de datos (sillas, órdenes,
// outbox) → pasarela de pagos. Pasos 1 y 2 síncronos y paso 3 por outbox (ADR-001).
//
// TÁCTICA 1 aplicada: bloqueo atómico con vencimiento (ver repositorio-sillas.js).
export function crearCheckout({ sillas, ordenes, pasarela, outbox, config, reloj = Date.now }) {
  async function bloquear(sillaId, compradorId) {
    const ordenId = ordenes.nuevoId();
    const ahora = reloj();
    const silla = await sillas.bloquearSiDisponible(sillaId, ordenId, ahora, ahora + config.bloqueoMs);
    if (!silla) return { ok: false, motivo: 'silla no disponible' };
    await ordenes.crear({ id: ordenId, sillaId, compradorId, monto: silla.precio });
    return { ok: true, ordenId, venceEn: silla.venceEn };
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
      await sillas.liberarSiBloqueadaPor(orden.sillaId, ordenId);
      await ordenes.actualizar(ordenId, { estado: 'rechazada' });
      return { ok: false, motivo: respuesta.estado };
    }
    await confirmarPago({ ordenId, transaccionId: respuesta.transaccionId });
    return { ok: true };
  }

  // La llaman la respuesta de la pasarela y también su webhook de conciliación (RF-10).
  async function confirmarPago({ ordenId, transaccionId }) {
    const orden = await ordenes.obtener(ordenId);
    const vendida = await sillas.venderSiBloqueadaPor(orden.sillaId, ordenId);
    if (!vendida) {
      // FALLA NUEVA que trae el vencimiento: el pago llegó cuando la silla ya
      // era de otro. No se vende dos veces; se compensa con un reembolso.
      await ordenes.actualizar(ordenId, { estado: 'reembolso_pendiente', transaccionId });
      await outbox.agregar({ tipo: 'reembolsar', ordenId, sillaId: orden.sillaId });
      return;
    }
    await ordenes.actualizar(ordenId, { estado: 'pagada', transaccionId });
    await outbox.agregar({ tipo: 'emitirQR', ordenId, sillaId: orden.sillaId });
  }

  pasarela.alRecibirConfirmacion(confirmarPago);
  return { bloquear, pagar, confirmarPago };
}
