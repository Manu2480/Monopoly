// jugadores_tablero.js
import { getJugadoresLS, updateJugador, replaceJugadores } from "./jugadores_estado.js";
import { clearAccionesCasilla, renderPanelCasilla } from "./ui_acciones.js";


/**
 * moverJugador
 */
export function moverJugador(idJugador, pasos, jugadores, tableroData, casillasVisibles, calcularRangoVisible) {
  if (!Array.isArray(jugadores) || !tableroData?.casillas) return null;

  const totalCasillas = tableroData.casillas.length;
  const idxJugador = jugadores.findIndex(j => j.id === idJugador);
  if (idxJugador === -1) return null;

  const jugador = jugadores[idxJugador];

  const posActual = Number.isFinite(jugador.posicionActual) ? jugador.posicionActual : 0;
  let nuevaPos = (posActual + pasos) % totalCasillas;

  // Si pasó por la salida
  if (posActual + pasos >= totalCasillas) {
    const salida = tableroData.casillas.find(c => c.id === 0) || tableroData.casillas[0];
    if (salida && salida.action && typeof salida.action.money === "number") {
      jugador.dinero = (jugador.dinero || 0) + salida.action.money;
    }
  }

  jugador.posicionActual = nuevaPos;
  jugadores[idxJugador] = jugador;

  try {
    replaceJugadoresIfDifferent(jugadores);
  } catch (err) {
    updateJugador(jugador);
  }

  return jugador;
}

/**
 * cambiarTurno
 */
export function cambiarTurno(jugadores, indiceActual, setIndiceCB, setPuedeTirarCB, setHaMovidoCB) {
  if (!Array.isArray(jugadores) || typeof indiceActual !== "number") return;

  jugadores.forEach(j => (j.turno = false));

  const siguiente = (indiceActual + 1) % jugadores.length;
  if (jugadores[siguiente]) {
    jugadores[siguiente].turno = true;
    // NO reiniciamos jugadores[siguiente].accionResuelta aquí
    // (la acción resuelta debe mantenerse hasta que el jugador se mueva)
  }

  replaceJugadoresIfDifferent(jugadores);

  if (typeof setIndiceCB === "function") setIndiceCB(siguiente);
  if (typeof setPuedeTirarCB === "function") setPuedeTirarCB(true);
  if (typeof setHaMovidoCB === "function") setHaMovidoCB(false);

  // limpiar estado visual de la casilla
  clearAccionesCasilla();
  renderPanelCasilla(null);
}



/* ---------- Helpers ---------- */
function replaceJugadoresIfDifferent(jugadoresArray) {
  const stored = getJugadoresLS();
  const same = JSON.stringify(stored) === JSON.stringify(jugadoresArray);
  if (!same) {
    replaceJugadores(jugadoresArray);
  }
}
