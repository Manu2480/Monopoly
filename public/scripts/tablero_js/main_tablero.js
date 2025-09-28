// ======================== IMPORTS ========================
import { cargarTablero, cargarJugadores } from "./api_tablero.js";
import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores } from "./ui_tablero.js";
import { tirarDados } from "./dados_tablero.js";

import { cambiarTurno, moverJugador } from "./jugadores_tablero.js";
import { determinarCasillasVisibles, calcularRangoVisible } from "./utils_tablero.js";
import { resetPanelCarta } from "./cartas_tablero.js";

import { mostrarAccionesCasillaDOM, clearAccionesCasilla, renderPanelCasilla, tienePendientes} from "./ui_acciones.js";
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
  jugadores.forEach(j => {
    j.turno = false;
    j.accionResuelta = false; // ✅ resetear al inicio
  });
  if (jugadores[indiceTurno]) jugadores[indiceTurno].turno = true;

  juegoIniciado = true;
  puedeTirar = true;
  haMovido = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  setEstadoBotones("jugando");

  mostrarAccionesCasillaParaJugadorActual();
}

function finalizarJuego() {
  jugadores.forEach(j => (j.turno = false));
  juegoIniciado = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  resetPerfilJugador();

  setEstadoBotones("finalizado");
  const cont = document.getElementById("acciones-casilla");
  if (cont) cont.innerHTML = "";
}

// ======================== ACCIONES CASILLA ACTUAL ========================
function bloquearPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = true;
}
function habilitarPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = false;
}

async function actualizarUICompleta() {
  jugadores = await cargarJugadores();
  casillasVisibles = determinarCasillasVisibles();
  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  mostrarAccionesCasillaParaJugadorActual();
}

function mostrarAccionesCasillaParaJugadorActual() {
  const jugador = jugadores[indiceTurno];
  if (!jugador || !tableroData?.casillas) return;
  const pos = typeof jugador.posicionActual === "number" ? jugador.posicionActual : 0;
  const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;
  if (!casillaActual) {
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
    await cargarTablero(tableroData);
    jugadores = await cargarJugadores();

    casillasVisibles = determinarCasillasVisibles();
    renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    mostrarAccionesCasillaParaJugadorActual();
    renderizarBarraJugadores(jugadores);

    renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

    setEstadoBotones("no-iniciado");

    // ▶️ Iniciar / Finalizar juego
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
        actualizarUICompleta

      )
      
    );

    // 👣 Mover manualmente
    document.getElementById("btn-mover").addEventListener("click", async () => {
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

        haMovido = true; // ✅ cuenta como movimiento de turno

        // 🔄 resetear acción pendiente al moverse
        if (jugadores[indiceTurno]) {
          jugadores[indiceTurno].accionResuelta = false;
        }

        // 🔄 refrescar tablero y perfil
        await actualizarUICompleta();

        // 👀 actualizar casilla actual
        mostrarAccionesCasillaParaJugadorActual();
      }

      input.value = "";
    });


    // ⏭️ Cambiar turno
    document.getElementById("btn-turno").addEventListener("click", async () => {
      if (!haMovido) {
        alert("Debes mover antes de pasar turno.");
        return;
      }

      const jugadorActual = jugadores[indiceTurno];
      if ((jugadorActual?.deudaBanco || 0) > 0) {
        alert("Tienes deuda pendiente. Vende propiedades o hipoteca para cubrirla antes de pasar turno.");
        return;
      }

      // ✅ Verificar si tiene pendientes
      const pos = typeof jugadorActual.posicionActual === "number" ? jugadorActual.posicionActual : 0;
      const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;

      // 🔎 Solo bloquear si la casilla realmente requiere acción y no está resuelta
      if (tienePendientes(jugadorActual, casillaActual) && !jugadorActual.accionResuelta) {
        alert("⚠️ No puedes pasar el turno: primero resuelve la acción de esta casilla.");
        return;
      }

      cambiarTurno(
        jugadores,
        indiceTurno,
        v => (indiceTurno = v),
        v => (puedeTirar = v),
        v => (haMovido = v)
      );

      // NO resetear accionResuelta del nuevo jugador aquí:
      // (dejar que permanezca true si ya había pagado la casilla)

      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
      renderizarBarraJugadores(jugadores);
      renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);
      resetPanelCarta();
      mostrarAccionesCasillaParaJugadorActual();

    });



    // 🔄 Redimensionar tablero
    window.addEventListener("resize", () => {
      casillasVisibles = determinarCasillasVisibles();
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    });
    } catch (err) {
      console.error("❌ Error iniciando el juego:", err);
    }
};
