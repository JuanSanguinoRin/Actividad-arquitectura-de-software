export const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export function conTimeout(promesa, ms) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('timeout')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

// Generador pseudoaleatorio con semilla, para que cada ejecución de la prueba
// produzca las mismas latencias de la pasarela.
export function crearAleatorio(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 2 ** 32;
  };
}
