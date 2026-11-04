// Tiempos del caso, escalados para que la prueba corra en pocos segundos.
// Supuesto de laboratorio: 1 segundo del caso = 2 ms de la prueba. La proporción
// entre la pasarela, el timeout y el bloqueo se conserva.
export const MS_POR_SEGUNDO = 2;

export const CONFIG = {
  // La pasarela tarda entre 2 y 10 s por cobro (caso, sección 5).
  pasarelaLatenciaMs: [2 * MS_POR_SEGUNDO, 10 * MS_POR_SEGUNDO],
  // Timeout de la llamada a la pasarela: 15 s (RNF-06 en requisitos.md).
  timeoutPasarelaMs: 15 * MS_POR_SEGUNDO,
  // Duración del bloqueo de una silla: 10 minutos (supuesto en requisitos.md).
  bloqueoMs: 10 * 60 * MS_POR_SEGUNDO,
  // Una consulta a la base de datos, sin escalar (supuesto: PostgreSQL en la misma red, ~2 ms).
  latenciaBdMs: 2,
};
