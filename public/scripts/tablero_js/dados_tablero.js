import { moverJugador } from "./jugadores_tablero.js";
import { mostrarResultadoDados } from "./ui_tablero.js";

export function tirarDados(
  jugadores,
  indiceTurno,
  tableroData,
  casillasVisibles,
  calcularRangoVisible,
  puedeTirar,
  setPuedeTirar,
  setHaMovido
) {
  if (!puedeTirar) {
    alert("Ya tiraste los dados.");
    return;
  }

  const dado1 = document.getElementById("dado1");
  const dado2 = document.getElementById("dado2");
  if (!dado1 || !dado2) return;

  const resultado1 = getCara(); // ahora devuelve 1..6 (número)
  const resultado2 = getCara();

  // animar cada dado mostrando varias caras antes de la final
  rodarDado(dado1, resultado1);
  rodarDado(dado2, resultado2);

  const suma = obtenerValorDado(resultado1) + obtenerValorDado(resultado2);

  // Mostrar total luego de la animación (sincronizado con la duración)
  setTimeout(() => {
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
    }

    setHaMovido(true);
    setPuedeTirar(suma % 2 === 0);
  }, 800); // espera a que terminen de "rodar"
}

/* ---- helpers ---- */

function getCara() {
  return Math.floor(Math.random() * 6) + 1; // 1..6
}
function obtenerValorDado(cara) {
  // Si cara es número, devolvemos él mismo (compatibilidad)
  return Number(cara) || 1;
}

/* Mapa de posiciones (índices 0..8 en grid 3x3) */
const FACE_MAP = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8] // columnas izquierda+derecha llenas
};

function ensurePips(dadoElem) {
  // si no hay 9 pips, los creamos
  if (dadoElem.querySelectorAll(".pip").length === 9) return;
  dadoElem.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span");
    s.className = "pip";
    // accesibilidad ligera
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

  // animación: cambiar caras aleatorias cada 80-120ms
  const interval = setInterval(() => {
    const randomFace = Math.floor(Math.random() * 6) + 1;
    setDadoValue(dadoElem, randomFace);
  }, 90);

  setTimeout(() => {
    clearInterval(interval);
    setDadoValue(dadoElem, resultadoFinal);
    dadoElem.classList.remove("rodando");
  }, 700); // coincide con la animación CSS
}

// Inicializar pips al cargar
window.addEventListener("DOMContentLoaded", () => {
  const dado1 = document.getElementById("dado1");
  const dado2 = document.getElementById("dado2");
  if (dado1 && dado2) {
    ensurePips(dado1);
    ensurePips(dado2);
    // opcional: mostrarlos con valor inicial
    setDadoValue(dado1, 1);
    setDadoValue(dado2, 1);
  }
});

