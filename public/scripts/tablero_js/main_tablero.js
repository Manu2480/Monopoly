import { cargarTablero, cargarJugadores } from "./api_tablero.js";
import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores } from "./ui_tablero.js";
import { tirarDados } from "./dados_tablero.js";
import { pedirPrestamo } from "./banco_tablero.js";
import { verPerfil, cambiarTurno, moverJugador } from "./jugadores_tablero.js";
import { determinarCasillasVisibles, calcularRangoVisible } from "./utils_tablero.js";

// ======================== VARIABLES GLOBALES ========================
let tableroData = { casillas: [], community_chest: [], chance: [] };
let jugadores = [];
let indiceTurno = 0;
let puedeTirar = true;
let haMovido = false;
let casillasVisibles = 11;
let juegoIniciado = false;

// ======================== FUNCIONES AUXILIARES ========================
function setEstadoBotones(estado) {
  const btnInicio = document.getElementById("btn-inicio");
  const botones = [
    document.getElementById("btn-dados"),
    document.getElementById("btn-mover"),
    document.getElementById("btn-prestamo"),
    document.getElementById("btn-perfil"),
    document.getElementById("btn-turno"),
  ];

  switch (estado) {
    case "no-iniciado":
      btnInicio.disabled = false;
      btnInicio.textContent = "▶️ Iniciar Juego";
      botones.forEach(b => (b.disabled = true));
      break;

    case "jugando":
      btnInicio.disabled = false;
      btnInicio.textContent = "⏹️ Finalizar Juego";
      botones.forEach(b => (b.disabled = false));
      break;

    case "finalizado":
      btnInicio.disabled = false;
      btnInicio.textContent = "▶️ Iniciar Juego";
      botones.forEach(b => (b.disabled = true));
      break;
  }
}

function iniciarJuego() {
  indiceTurno = 0;
  jugadores.forEach(j => (j.turno = false));
  if (jugadores[indiceTurno]) jugadores[indiceTurno].turno = true;

  juegoIniciado = true;
  puedeTirar = true;
  haMovido = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);

  setEstadoBotones("jugando");
}

function finalizarJuego() {
  jugadores.forEach(j => (j.turno = false));
  juegoIniciado = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);

  setEstadoBotones("finalizado");
}

// ======================== INIT ========================
window.onload = async () => {
  try {
    // Cargar tablero y jugadores
    await cargarTablero(tableroData);
    jugadores = await cargarJugadores();

    casillasVisibles = determinarCasillasVisibles();
    renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    renderizarBarraJugadores(jugadores);

    // Estado inicial: solo se puede iniciar juego
    setEstadoBotones("no-iniciado");

    // ======================== EVENTOS ========================

    // ▶️ Iniciar / Finalizar Juego
    document.getElementById("btn-inicio").addEventListener("click", () => {
      juegoIniciado ? finalizarJuego() : iniciarJuego();
    });

    // 🎲 Tirar dados
    document.getElementById("btn-dados").addEventListener("click", () =>
      tirarDados(
        jugadores,
        indiceTurno,
        tableroData,
        casillasVisibles,
        calcularRangoVisible,
        puedeTirar,
        v => (puedeTirar = v),
        v => (haMovido = v)
      )
    );

    // ➡️ Mover manual
    document.getElementById("btn-mover").addEventListener("click", () => {
      const input = document.getElementById("input-pasos");
      const pasos = parseInt(input.value);
      if (!isNaN(pasos) && pasos > 0) {
        moverJugador(
          jugadores[indiceTurno].id,
          pasos,
          jugadores,
          tableroData,
          casillasVisibles,
          calcularRangoVisible
        );
        haMovido = true;
      }
      input.value = "";
    });

    // 💵 Pedir préstamo
    document.getElementById("btn-prestamo").addEventListener("click", () =>
      pedirPrestamo(jugadores, indiceTurno)
    );

    // 👤 Ver perfil
    document.getElementById("btn-perfil").addEventListener("click", () =>
      verPerfil(jugadores, indiceTurno)
    );

    // ⏭️ Cambiar turno
    document.getElementById("btn-turno").addEventListener("click", () => {
      if (!haMovido) {
        alert("Debes mover antes de pasar turno.");
        return;
      }

      cambiarTurno(
        jugadores,
        indiceTurno,
        v => (indiceTurno = v),
        v => (puedeTirar = v),
        v => (haMovido = v)
      );

      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
      renderizarBarraJugadores(jugadores);
    });

    // 📱 Responsive: recalcular tablero al cambiar tamaño
    window.addEventListener("resize", () => {
      casillasVisibles = determinarCasillasVisibles();
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    });
  } catch (err) {
    console.error("❌ Error iniciando el juego:", err);
  }
};
