import { conTimeout } from '../util.js';

// Camino del escenario en la vista de contenedores:
// comprador → API de Boletería (este módulo) → base de datos (sillas, órdenes,
// outbox) → pasarela de pagos. Pasos 1 y 2 síncronos y paso 3 por outbox (ADR-001).
//
// TÁCTICA 1: bloqueo atómico con vencimiento (ver repositorio-sillas.js).
// TÁCTICA 2: idempotencia con el `ordenId` como llave, generado al bloquear y
// antes del primer intento de cobro (flujo-checkout.md, paso 2).
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
    // Estado nuevo que la app debe mostrar mientras la pasarela responde (2 a 10 s).
    const orden = (await ordenes.cambiarEstadoSi(ordenId, ['creada'], 'pago_en_verificacion'))
      ?? (await ordenes.obtener(ordenId));
    if (orden.estado === 'pagada') return { ok: true, yaPagada: true };
    let respuesta;
    try {
      respuesta = await conTimeout(
        // Con la misma llave, un segundo intento recibe el mismo resultado sin otro cobro.
        pasarela.cobrar({ monto: orden.monto, referencia: ordenId, idempotencyKey: ordenId }),
        config.timeoutPasarelaMs,
      );
    } catch {
      respuesta = { estado: 'sin respuesta' };
    }
    if (respuesta.estado !== 'aprobado') {
      await sillas.liberarSiBloqueadaPor(orden.sillaId, ordenId);
      // Sin respuesta no significa sin cobro: si el webhook confirma después, se reembolsa.
      const estado = respuesta.estado === 'sin respuesta' ? 'sin_respuesta' : 'rechazada';
      await ordenes.cambiarEstadoSi(ordenId, ['pago_en_verificacion'], estado);
      return { ok: false, motivo: respuesta.estado };
    }
    await confirmarPago({ ordenId, transaccionId: respuesta.transaccionId });
    return { ok: true };
  }

  // La llaman la respuesta de la pasarela y también su webhook de conciliación (RF-10).
  async function confirmarPago({ ordenId, transaccionId }) {
    // TÁCTICA 2: la misma confirmación puede llegar varias veces; solo la primera avanza.
    const orden = await ordenes.cambiarEstadoSi(
      ordenId, ['creada', 'pago_en_verificacion', 'sin_respuesta'], 'confirmando', { transaccionId },
    );
    if (!orden) return { duplicada: true };

    const vendida = await sillas.venderSiBloqueadaPor(orden.sillaId, ordenId);
    if (!vendida) {
      // El pago llegó cuando la silla ya era de otro: no se vende dos veces, se reembolsa.
      await ordenes.actualizar(ordenId, { estado: 'reembolso_pendiente' });
      await outbox.agregar({ tipo: 'reembolsar', ordenId, sillaId: orden.sillaId });
      return { duplicada: false };
    }
    await ordenes.actualizar(ordenId, { estado: 'pagada' });
    await outbox.agregar({ tipo: 'emitirQR', ordenId, sillaId: orden.sillaId });
    return { duplicada: false };
  }

  pasarela.alRecibirConfirmacion(confirmarPago);
  return { bloquear, pagar, confirmarPago };
}
