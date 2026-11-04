// Módulo de sillas: la tabla `sillas` del contenedor "Base de datos".
export function crearRepositorioSillas({ bd }) {
  const sillas = new Map();

  return {
    // Datos iniciales del evento (no cuentan como consultas).
    sembrar(lista) {
      for (const s of lista) sillas.set(s.id, { estado: 'libre', ordenId: null, venceEn: null, ...s });
    },
    // SELECT * FROM sillas WHERE id = $1
    async obtener(id) {
      await bd.consulta();
      const silla = sillas.get(id);
      return silla && { ...silla };
    },

    // TÁCTICA 1: bloqueo atómico con vencimiento. Revisar y escribir es una sola
    // sentencia, así que otra solicitud no puede colarse entre las dos. En PostgreSQL:
    //   UPDATE sillas SET estado = 'bloqueada', orden_id = $2, vence_en = $3
    //    WHERE id = $1 AND (estado = 'libre' OR (estado = 'bloqueada' AND vence_en <= now()))
    //   RETURNING *
    // Devuelve la silla bloqueada, o null si otra orden la tiene vigente.
    async bloquearSiDisponible(id, ordenId, ahora, venceEn) {
      await bd.consulta();
      const silla = sillas.get(id);
      const disponible = silla && (silla.estado === 'libre' || (silla.estado === 'bloqueada' && silla.venceEn <= ahora));
      if (!disponible) return null;
      Object.assign(silla, { estado: 'bloqueada', ordenId, venceEn });
      return { ...silla };
    },
    // UPDATE sillas SET estado = 'vendida' WHERE id = $1 AND estado = 'bloqueada' AND orden_id = $2
    async venderSiBloqueadaPor(id, ordenId) {
      await bd.consulta();
      const silla = sillas.get(id);
      if (!silla || silla.estado !== 'bloqueada' || silla.ordenId !== ordenId) return false;
      Object.assign(silla, { estado: 'vendida', venceEn: null });
      return true;
    },
    // UPDATE sillas SET estado = 'libre', orden_id = NULL WHERE id = $1 AND estado = 'bloqueada' AND orden_id = $2
    async liberarSiBloqueadaPor(id, ordenId) {
      await bd.consulta();
      const silla = sillas.get(id);
      if (!silla || silla.estado !== 'bloqueada' || silla.ordenId !== ordenId) return false;
      Object.assign(silla, { estado: 'libre', ordenId: null, venceEn: null });
      return true;
    },
  };
}
