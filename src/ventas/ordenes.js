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
    // Solo para las pruebas: lee la tabla completa sin costo.
    listar: () => [...ordenes.values()].map((o) => ({ ...o })),
  };
}
