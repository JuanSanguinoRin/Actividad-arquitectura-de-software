// Tabla outbox del ADR-001. La API escribe aquí la tarea de emitir el QR y el
// worker interno la procesa después. La prueba cuenta las tareas `emitirQR`
// de una silla: si hay dos, se emitirían dos QR para la misma silla.
export function crearOutbox({ bd }) {
  const tareas = [];
  return {
    // INSERT INTO outbox (tipo, orden_id, silla_id) VALUES (...)
    async agregar(tarea) {
      await bd.consulta();
      tareas.push({ ...tarea });
    },
    // Solo para las pruebas.
    listar: () => tareas.map((t) => ({ ...t })),
  };
}
