import { renderizarBarraJugadores } from "./ui_tablero.js";

export function pedirPrestamo(jugadores, indiceTurno) {
    const input = document.getElementById("monto-prestamo");
    let monto = parseInt(input.value);
    if (isNaN(monto) || monto <= 0) {
        alert("Monto inválido");
        return;
    }
    const jugador = jugadores[indiceTurno];
    if (!jugador) return;
    jugador.dinero += monto;
    alert(`${jugador.nombre} recibió un préstamo de $${monto}`);
    input.value = "";
    renderizarBarraJugadores(jugadores);
}
