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
    // UPDATE sillas SET estado = $2, orden_id = $3 WHERE id = $1
    async guardar(silla) {
      await bd.consulta();
      sillas.set(silla.id, { ...silla });
    },
  };
}
