import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores, mostrarPanelCasilla } from "./ui_tablero.js";

export function moverJugador(idJugador, pasos, jugadores, tableroData, casillasVisibles, calcularRangoVisible) {
    const jugador = jugadores.find(j => j.id === idJugador);
    if (!jugador) return;

    const totalCasillas = tableroData.casillas.length || 40;
    jugador.posicionActual = ((jugador.posicionActual || 0) + pasos) % totalCasillas;

    renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    renderizarBarraJugadores(jugadores);
    mostrarPanelCasilla(tableroData.casillas[jugador.posicionActual], jugador, tableroData);
}

export function cambiarTurno(jugadores, indiceTurno, setIndiceTurno, setPuedeTirar, setHaMovido) {
    jugadores[indiceTurno].turno = false;
    const nuevoTurno = (indiceTurno + 1) % jugadores.length;
    jugadores[nuevoTurno].turno = true;

    setIndiceTurno(nuevoTurno);
    setPuedeTirar(true);
    setHaMovido(false);

    return jugadores[nuevoTurno];
}

export function verPerfil(jugadores, indiceTurno) {
    const jugador = jugadores[indiceTurno];
    if (!jugador) {
        alert("No hay jugador en turno.");
        return;
    }
    alert(`👤 ${jugador.nombre}\n💰 Dinero: ${jugador.dinero}\n📍 Casilla: ${jugador.posicionActual}`);
}
