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
  const btnDados = document.getElementById("btn-dados");
  const btnMover = document.getElementById("btn-mover");
  const btnPrestamo = document.getElementById("btn-prestamo");
  const btnPerfil = document.getElementById("btn-perfil");
  const btnTurno = document.getElementById("btn-turno");

  if (estado === "no-iniciado") {
    btnInicio.disabled = false;
    btnInicio.textContent = "▶️ Iniciar Juego";
    [btnDados, btnMover, btnPrestamo, btnPerfil, btnTurno].forEach(b => b.disabled = true);
  }

  if (estado === "jugando") {
    btnInicio.disabled = false;
    btnInicio.textContent = "⏹️ Finalizar Juego";
    [btnDados, btnMover, btnPrestamo, btnPerfil, btnTurno].forEach(b => b.disabled = false);
  }

  if (estado === "finalizado") {
    btnInicio.disabled = false;
    btnInicio.textContent = "▶️ Iniciar Juego";
    [btnDados, btnMover, btnPrestamo, btnPerfil, btnTurno].forEach(b => b.disabled = true);
  }
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
      if (!juegoIniciado) {
        // Arrancar juego
        indiceTurno = 0;
        jugadores.forEach(j => j.turno = false);
        if (jugadores[indiceTurno]) jugadores[indiceTurno].turno = true;

        juegoIniciado = true;
        puedeTirar = true;
        haMovido = false;

        renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
        renderizarBarraJugadores(jugadores);

        setEstadoBotones("jugando");
      } else {
        // Finalizar juego
        jugadores.forEach(j => j.turno = false);
        juegoIniciado = false;

        renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
        renderizarBarraJugadores(jugadores);

        setEstadoBotones("finalizado");
      }
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
