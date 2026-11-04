import { dormir, crearAleatorio } from '../util.js';

// Adaptador simulado de la pasarela de pagos (sistema externo). Es el mecanismo
// que reproduce la falla a voluntad. Tarda entre 2 y 10 s por cobro (escalados),
// como dice el caso, y tiene tres modos:
// - "normal":  aprueba y confirma una vez, en la respuesta.
// - "doble":   aprueba y, además de responder, envía la misma confirmación por
//              el webhook de conciliación (RF-10): la confirmación llega dos veces.
// - "rechazo": rechaza el cobro sin explicación (caso, sección 5).
// Como las pasarelas reales, acepta una llave de idempotencia: si la recibe
// repetida, devuelve el mismo resultado sin cobrar otra vez.
export function crearPasarelaSimulada({ modo = 'normal', latenciaMs, semilla = 42 }) {
  const aleatorio = crearAleatorio(semilla);
  const cobrosEfectivos = [];
  const porLlave = new Map();
  const webhooksPendientes = new Set();
  let alConfirmar = null;
  let siguiente = 0;

  async function procesar({ monto, referencia }) {
    const [minimo, maximo] = latenciaMs;
    await dormir(minimo + Math.floor(aleatorio() * (maximo - minimo + 1)));
    if (modo === 'rechazo') return { estado: 'rechazado', referencia };

    const respuesta = { estado: 'aprobado', transaccionId: `tx-${++siguiente}`, referencia, monto };
    cobrosEfectivos.push(respuesta);
    if (modo === 'doble' && alConfirmar) {
      const webhook = dormir(minimo)
        .then(() => alConfirmar({ ordenId: referencia, transaccionId: respuesta.transaccionId }))
        .catch((error) => console.error('Error en el webhook:', error))
        .finally(() => webhooksPendientes.delete(webhook));
      webhooksPendientes.add(webhook);
    }
    return respuesta;
  }

  return {
    cobrar({ monto, referencia, idempotencyKey }) {
      if (!idempotencyKey) return procesar({ monto, referencia });
      if (!porLlave.has(idempotencyKey)) porLlave.set(idempotencyKey, procesar({ monto, referencia }));
      return porLlave.get(idempotencyKey);
    },
    // Registro del webhook de conciliación.
    alRecibirConfirmacion(funcion) {
      alConfirmar = funcion;
    },
    async esperarWebhooks() {
      while (webhooksPendientes.size > 0) await Promise.all([...webhooksPendientes]);
    },
    cobrosEfectivos: () => cobrosEfectivos.map((c) => ({ ...c })),
  };
}
