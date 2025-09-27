// ======================== IMPORTS ========================
import { cargarTablero, cargarJugadores } from "./api_tablero.js";
import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores } from "./ui_tablero.js";
import { tirarDados } from "./dados_tablero.js";

import { cambiarTurno, moverJugador } from "./jugadores_tablero.js";
import { determinarCasillasVisibles, calcularRangoVisible } from "./utils_tablero.js";
import { resetPanelCarta } from "./cartas_tablero.js";

import { mostrarAccionesCasillaDOM } from "./ui_acciones.js";
import { renderizarPerfilJugador, resetPerfilJugador } from "./perfil_jugador_tablero.js";

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
  // PERFIL: ahora recibe tableroData y callback para refrescar UI
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  setEstadoBotones("jugando");

  // Mostrar acciones de la casilla inicial del jugador
  mostrarAccionesCasillaParaJugadorActual();
}

function finalizarJuego() {
  jugadores.forEach(j => (j.turno = false));
  juegoIniciado = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  resetPerfilJugador(); // 👈 limpiar perfil

  setEstadoBotones("finalizado");
  // limpiar acciones de casilla
  const cont = document.getElementById("acciones-casilla");
  if (cont) cont.innerHTML = "";
}

// ======================== ACCIONES --Z CASILLA ACTUAL ========================
function bloquearPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = true;
}
function habilitarPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = false;
}

async function actualizarUICompleta() {
  // recargar jugadores desde LS / API
  jugadores = await cargarJugadores();
  casillasVisibles = determinarCasillasVisibles();
  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  // renderizar perfil del jugador actual con tableroData y callback
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  // mostrar acciones de casilla para el jugador actual (si hay casilla)
  mostrarAccionesCasillaParaJugadorActual();
}

// Muestra las acciones en DOM para la casilla donde está el jugador actual
function mostrarAccionesCasillaParaJugadorActual() {
  const jugador = jugadores[indiceTurno];
  if (!jugador || !tableroData?.casillas) return;
  const pos = typeof jugador.posicionActual === "number" ? jugador.posicionActual : 0;
  const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;
  if (!casillaActual) {
    // limpiar si no hay casilla
    const cont = document.getElementById("acciones-casilla");
    if (cont) cont.innerHTML = "";
    return;
  }

  mostrarAccionesCasillaDOM(
    jugador,
    casillaActual,
    jugadores,
    tableroData,
    {
      actualizarUI: actualizarUICompleta,
      bloquearPasarTurno,
      habilitarPasarTurno
    }
  );
}

// ======================== INIT ========================
window.onload = async () => {
  try {
    // Cargar tablero y jugadores
    await cargarTablero(tableroData);
    jugadores = await cargarJugadores();

    casillasVisibles = determinarCasillasVisibles();
    renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    mostrarAccionesCasillaParaJugadorActual();
    renderizarBarraJugadores(jugadores);

    // perfil inicial (con tableroData y callback)
    renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

    setEstadoBotones("no-iniciado");

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
        v => (haMovido = v),
        actualizarUICompleta // ← nuevo argumento
      )
    );

    // ➡️ Mover manual
    document.getElementById("btn-mover").addEventListener("click", async () => {
      const input = document.getElementById("input-pasos");
      const pasos = parseInt(input.value);
      if (!isNaN(pasos) && pasos > 0) {
        // moverJugador debe actualizar la posición en la estructura 'jugadores' en memoria
        moverJugador(
          jugadores[indiceTurno].id,
          pasos,
          jugadores,
          tableroData,
          casillasVisibles,
          calcularRangoVisible
        );
        haMovido = true;

        // actualizar UI tras mover
        await actualizarUICompleta();
      }
      input.value = "";
    });

    // Mostrar acciones iniciales (para el jugador en su casilla actual)
    mostrarAccionesCasillaParaJugadorActual();

    // ⏭️ Cambiar turno
    document.getElementById("btn-turno").addEventListener("click", async () => {
      if (!haMovido) {
        alert("Debes mover antes de pasar turno.");
        return;
      }

      // verificar deuda antes de permitir cambio
      const jugadorActual = jugadores[indiceTurno];
      if ((jugadorActual?.deudaBanco || 0) > 0) {
        alert("Tienes deuda pendiente. Vende propiedades o hipoteca para cubrirla antes de pasar turno.");
        return;
      }

      cambiarTurno(
        jugadores,
        indiceTurno,
        v => (indiceTurno = v),
        v => (puedeTirar = v),
        v => (haMovido = v)
      );

      // volver a renderizar y actualizar perfil con callback
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
      renderizarBarraJugadores(jugadores);
      renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);
      resetPanelCarta(); // 👈 volver a ⬜ al cambiar turno

      // mostrar acciones para la nueva casilla del jugador al iniciar su turno
      mostrarAccionesCasillaParaJugadorActual();
    });

    // redimensionamiento
    window.addEventListener("resize", () => {
      casillasVisibles = determinarCasillasVisibles();
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    });
  } catch (err) {
    console.error("❌ Error iniciando el juego:", err);
  }
};
