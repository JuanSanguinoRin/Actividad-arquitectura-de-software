import { dormir } from './util.js';

// Base de datos simulada (las tablas de PostgreSQL del contenedor "Base de
// datos"). Cada sentencia cuesta un viaje de ida y vuelta (latenciaBdMs). Entre
// una sentencia y la siguiente otras solicitudes pueden ejecutarse, como en la
// base real; lo que ocurre dentro de una misma sentencia es atómico.
export function crearBd({ latenciaBdMs }) {
  let consultas = 0;
  return {
    async consulta() {
      consultas++;
      await dormir(latenciaBdMs);
    },
    consultas: () => consultas,
  };
}
