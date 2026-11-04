// Mide el costo de la versión actual del código para comparar antes y después
// de cada táctica. Se ejecuta con `npm run costo` en cada commit.
import { crearSistema } from '../src/sistema.js';

const percentil = (valores, p) => {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)];
};
const ms = (n) => `${n.toFixed(1)} ms`;

// 1. Bloquear una silla libre, sin competencia (200 sillas distintas, una por una).
{
  const s = crearSistema({ sillasExtra: 200 });
  const tiempos = [];
  for (let i = 1; i <= 200; i++) {
    const inicio = performance.now();
    await s.checkout.bloquear(`S-${i}`, `c-${i}`);
    tiempos.push(performance.now() - inicio);
  }
  console.log(`Bloquear sin competencia: p50 ${ms(percentil(tiempos, 50))}, p95 ${ms(percentil(tiempos, 95))}, ` +
    `${(s.bd.consultas() / 200).toFixed(1)} consultas a la BD por bloqueo`);
}

// 2. Compra completa (bloquear y pagar) de 200 compradores en 200 sillas distintas.
{
  const s = crearSistema({ sillasExtra: 200 });
  const tiempos = [];
  await Promise.all(Array.from({ length: 200 }, async (_, i) => {
    const inicio = performance.now();
    const b = await s.checkout.bloquear(`S-${i + 1}`, `c-${i}`);
    if (b.ok) await s.checkout.pagar(b.ordenId);
    tiempos.push(performance.now() - inicio);
  }));
  await s.pasarela.esperarWebhooks();
  console.log(`Compra completa sin competencia: p50 ${ms(percentil(tiempos, 50))}, p95 ${ms(percentil(tiempos, 95))}, ` +
    `${(s.bd.consultas() / 200).toFixed(1)} consultas a la BD por compra`);
}

// 3. 200 compradores sobre H-14: cuánto espera cada uno su respuesta.
{
  const s = crearSistema();
  const tiempos = [];
  let exitosos = 0;
  await Promise.all(Array.from({ length: 200 }, async (_, i) => {
    const inicio = performance.now();
    const b = await s.checkout.bloquear('H-14', `c-${i}`);
    if (b.ok) { exitosos++; await s.checkout.pagar(b.ordenId); }
    tiempos.push(performance.now() - inicio);
  }));
  await s.pasarela.esperarWebhooks();
  console.log(`200 compradores sobre H-14: p50 ${ms(percentil(tiempos, 50))}, p95 ${ms(percentil(tiempos, 95))}, ` +
    `${exitosos} lograron bloquear, ${s.pasarela.cobrosEfectivos().length} cobros`);
}
console.log('Escala: 1 s del caso = 2 ms (pasarela, timeout y bloqueo). La BD no se escala: 2 ms por consulta.');
