import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores, mostrarPanelCasilla } from "./ui_tablero.js";

export function moverJugador(idJugador, pasos, jugadores, tableroData, casillasVisibles, calcularRangoVisible) {
  const jugador = jugadores.find(j => j.id === idJugador);
  if (!jugador) return;

  const totalCasillas = tableroData.casillas.length || 40;
  const posicionActual = jugador.posicionActual ?? 0;

  jugador.posicionActual = (posicionActual + pasos) % totalCasillas;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  mostrarPanelCasilla(tableroData.casillas[jugador.posicionActual], jugador, tableroData);
}

export function cambiarTurno(jugadores, indiceTurno, setIndiceTurno, setPuedeTirar, setHaMovido) {
  // Desactivar turno actual
  jugadores[indiceTurno].turno = false;

  // Calcular nuevo turno
  const nuevoTurno = (indiceTurno + 1) % jugadores.length;
  jugadores[nuevoTurno].turno = true;

  // Actualizar estado externo
  setIndiceTurno(nuevoTurno);
  setPuedeTirar(true);
  setHaMovido(false);

  return jugadores[nuevoTurno];
}
