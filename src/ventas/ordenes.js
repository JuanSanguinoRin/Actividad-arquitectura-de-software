// Tabla `ordenes`. El `ordenId` se genera al bloquear la silla, antes de
// cualquier cobro (flujo-checkout.md, paso 1).
export function crearOrdenes({ bd }) {
  const ordenes = new Map();
  let siguiente = 0;

  return {
    nuevoId: () => `orden-${++siguiente}`,
    // INSERT INTO ordenes ...
    async crear({ id, ...datos }) {
      await bd.consulta();
      const orden = { id, estado: 'creada', ...datos };
      ordenes.set(id, orden);
      return { ...orden };
    },
    // SELECT * FROM ordenes WHERE id = $1
    async obtener(id) {
      await bd.consulta();
      const orden = ordenes.get(id);
      return orden && { ...orden };
    },
    // UPDATE ordenes SET ... WHERE id = $1
    async actualizar(id, cambios) {
      await bd.consulta();
      Object.assign(ordenes.get(id), cambios);
    },
    // TÁCTICA 2: cambio de estado condicional. Solo avanza si la orden está en
    // uno de los estados esperados, así que una segunda llamada con la misma
    // orden no hace nada. En PostgreSQL:
    //   UPDATE ordenes SET estado = $3 WHERE id = $1 AND estado = ANY($2) RETURNING *
    async cambiarEstadoSi(id, desde, hacia, cambios = {}) {
      await bd.consulta();
      const orden = ordenes.get(id);
      if (!orden || !desde.includes(orden.estado)) return null;
      Object.assign(orden, { estado: hacia, ...cambios });
      return { ...orden };
    },
    // Solo para las pruebas: lee la tabla completa sin costo.
    listar: () => [...ordenes.values()].map((o) => ({ ...o })),
  };
}
