// estadisticas_renta.js
// Lleva un registro simple de pagos de renta y permite cálculos por rangos.

const rentLog = []; // { casillaId, monto, timestamp }

export function registrarPagoRenta(casillaId, monto) {
  if (typeof monto !== "number" || monto <= 0) return;
  rentLog.push({
    casillaId: Number(casillaId),
    monto,
    timestamp: Date.now()
  });
}

export function obtenerPagos() {
  return rentLog.slice();
}

/**
 * Calcula el promedio de pagos cuyo casillaId esté dentro del rango [inicio, fin]
 * Devuelve 0 si no hay pagos.
 */
export function promedioRango(inicio, fin) {
  inicio = Number(inicio);
  fin = Number(fin);
  if (isNaN(inicio) || isNaN(fin)) return 0;
  const pagos = rentLog.filter(r => r.casillaId >= inicio && r.casillaId <= fin);
  if (pagos.length === 0) return 0;
  const suma = pagos.reduce((s, p) => s + p.monto, 0);
  return suma / pagos.length;
}

/**
 * Recorre todo el tablero en tramos de `casillasVisibles` y devuelve:
 * { inicio, fin, promedio } para el tramo con mayor promedio.
 * Si no hay pagos devuelve null.
 */
export function tramoConMayorPromedio(totalCasillas, casillasVisibles) {
  totalCasillas = Number(totalCasillas) || 0;
  casillasVisibles = Number(casillasVisibles) || 1;
  if (totalCasillas <= 0) return null;

  let mejor = null;
  for (let inicio = 0; inicio < totalCasillas; inicio += casillasVisibles) {
    const fin = Math.min(inicio + casillasVisibles - 1, totalCasillas - 1);
    const avg = promedioRango(inicio, fin);
    if (!mejor || avg > mejor.promedio) {
      mejor = { inicio, fin, promedio: avg };
    }
  }
  // Si no hay pagos en ningún tramo, devolver null
  if (mejor && mejor.promedio === 0) return null;
  return mejor;
}

/** Limpia el log (útil para reiniciar partida) */
export function resetEstadisticas() {
  rentLog.length = 0;
}
