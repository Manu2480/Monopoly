// dados_tablero.js
import { moverJugador } from "./jugadores_tablero.js";
import { mostrarResultadoDados } from "./ui_tablero.js";
import { renderizarPerfilJugador } from "./perfil_jugador_tablero.js";

/**
 * tirarDados(..., actualizarUI)
 * - ahora recibe un parámetro adicional `actualizarUI` (función) que
 *   será llamada después de mover para re-renderizar tablero/perfil.
 *
 * Firma:
 * tirarDados(
 *   jugadores,
 *   indiceTurno,
 *   tableroData,
 *   casillasVisibles,
 *   calcularRangoVisible,
 *   puedeTirar,
 *   setPuedeTirar,
 *   setHaMovido,
 *   actualizarUI // NUEVO
 * )
 */
export function tirarDados(
  jugadores,
  indiceTurno,
  tableroData,
  casillasVisibles,
  calcularRangoVisible,
  puedeTirar,
  setPuedeTirar,
  setHaMovido,
  actualizarUI // nuevo callback
) {
  if (!puedeTirar) {
    alert("Ya tiraste los dados.");
    return;
  }

  // 🔄 cada vez que tiramos, reiniciamos acción pendiente
  if (jugadores[indiceTurno]) {
    jugadores[indiceTurno].accionResuelta = false;
  }

  const dado1 = document.getElementById("dado1");
  const dado2 = document.getElementById("dado2");
  if (!dado1 || !dado2) return;

  const resultado1 = getCara(); // 1..6
  const resultado2 = getCara();

  // animación de dados
  rodarDado(dado1, resultado1);
  rodarDado(dado2, resultado2);

  const suma = obtenerValorDado(resultado1) + obtenerValorDado(resultado2);

  // Después de la animación mostramos resultado y movemos
  setTimeout(async () => {
    mostrarResultadoDados(suma);

    if (jugadores.length > 0) {
      moverJugador(
        jugadores[indiceTurno].id,
        suma,
        jugadores,
        tableroData,
        casillasVisibles,
        calcularRangoVisible
      );

      // REFRESCAR UI: si recibimos callback lo usamos, si no, al menos actualizamos perfil
      if (typeof actualizarUI === "function") {
        await actualizarUI();
      } else {
        // compatibilidad: actualizar solo el perfil
        renderizarPerfilJugador(jugadores[indiceTurno], tableroData, null);
      }

      // 👀 actualizar casilla actual después de mover con dados
      if (typeof window.mostrarAccionesCasillaParaJugadorActual === "function") {
        window.mostrarAccionesCasillaParaJugadorActual();
      }
    }

    setHaMovido(true);
    setPuedeTirar(suma % 2 === 0);
  }, 800);
}

/* ---- helpers ---- */

function getCara() {
  return Math.floor(Math.random() * 6) + 1; // 1..6
}

function obtenerValorDado(cara) {
  return Number(cara) || 1;
}

const FACE_MAP = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function ensurePips(dadoElem) {
  if (dadoElem.querySelectorAll(".pip").length === 9) return;
  dadoElem.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span");
    s.className = "pip";
    s.setAttribute("data-pip-index", i);
    dadoElem.appendChild(s);
  }
}

function setDadoValue(dadoElem, value) {
  ensurePips(dadoElem);
  const pips = Array.from(dadoElem.querySelectorAll(".pip"));
  const activeIdx = FACE_MAP[value] || FACE_MAP[1];
  pips.forEach((pip, idx) => {
    pip.classList.toggle("active", activeIdx.includes(idx));
  });
}

function rodarDado(dadoElem, resultadoFinal) {
  dadoElem.classList.add("rodando");

  const interval = setInterval(() => {
    const randomFace = Math.floor(Math.random() * 6) + 1;
    setDadoValue(dadoElem, randomFace);
  }, 90);

  setTimeout(() => {
    clearInterval(interval);
    setDadoValue(dadoElem, resultadoFinal);
    dadoElem.classList.remove("rodando");
  }, 700);
}

window.addEventListener("DOMContentLoaded", () => {
  const dado1 = document.getElementById("dado1");
  const dado2 = document.getElementById("dado2");
  if (dado1 && dado2) {
    ensurePips(dado1);
    ensurePips(dado2);
    setDadoValue(dado1, 1);
    setDadoValue(dado2, 1);
  }
});
