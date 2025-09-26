import { renderizarBarraJugadores } from "./ui_tablero.js";

export function pedirPrestamo(jugadores, indiceTurno) {
  const input = document.getElementById("monto-prestamo");
  if (!input) {
    alert("No se encontró el campo de monto.");
    return;
  }

  const monto = parseInt(input.value, 10);
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor ingresa un monto válido.");
    return;
  }

  const jugador = jugadores[indiceTurno];
  if (!jugador) {
    alert("Jugador no encontrado.");
    return;
  }

  // 💵 Sumar dinero al jugador
  jugador.dinero = (jugador.dinero || 0) + monto;

  alert(`💰 ${jugador.nombre} recibió un préstamo de $${monto}`);
  input.value = "";

  // 🔄 Refrescar barra de jugadores
  renderizarBarraJugadores(jugadores);
}
