// dados_tablero.js (versión mejorada con lógica de cárcel)
import { moverJugador } from "./jugadores_tablero.js";
import { mostrarResultadoDados } from "./ui_tablero.js";
import { renderizarPerfilJugador } from "./perfil_jugador_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";

/**
 * tirarDados con lógica completa de cárcel
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
  actualizarUI
) {
  if (!puedeTirar) {
    alert("Ya tiraste los dados.");
    return;
  }

  const jugadorActual = jugadores[indiceTurno];
  if (!jugadorActual) return;

  // 🔄 cada vez que tiramos, reiniciamos acción pendiente
  jugadorActual.accionResuelta = false;

  const dado1 = document.getElementById("dado1");
  const dado2 = document.getElementById("dado2");
  if (!dado1 || !dado2) return;

  const resultado1 = getCara(); // 1..6
  const resultado2 = getCara();

  // animación de dados
  rodarDado(dado1, resultado1);
  rodarDado(dado2, resultado2);

  const suma = obtenerValorDado(resultado1) + obtenerValorDado(resultado2);
  const esDoble = resultado1 === resultado2;

  // Después de la animación procesamos el resultado
  setTimeout(async () => {
    mostrarResultadoDados(suma);

    // =================== LÓGICA DE CÁRCEL ===================
    if (jugadorActual.enCarcel) {
      // Inicializar intentos de cárcel si no existe
      if (typeof jugadorActual.intentosCarcel !== 'number') {
        jugadorActual.intentosCarcel = 0;
      }

      jugadorActual.intentosCarcel++;

      if (esDoble) {
        // ✅ SALIÓ CON DOBLES - sale de la cárcel y se mueve
        alert(`¡Sacaste dobles (${resultado1}, ${resultado2})! Sales de la cárcel.`);
        
        jugadorActual.enCarcel = false;
        jugadorActual.intentosCarcel = 0;
        
        // Se mueve normalmente
        moverJugador(
          jugadorActual.id,
          suma,
          jugadores,
          tableroData,
          casillasVisibles,
          calcularRangoVisible
        );
        
        // Puede tirar otra vez por sacar dobles
        setPuedeTirar(true);
        
      } else {
        // ❌ NO SACÓ DOBLES
        if (jugadorActual.intentosCarcel >= 3) {
          // Al tercer intento fallido, DEBE pagar la fianza automáticamente
          alert(`Tercer intento fallido. Debes pagar la fianza de $50 automáticamente.`);
          
          if (jugadorActual.dinero >= 50) {
            jugadorActual.dinero -= 50;
            jugadorActual.enCarcel = false;
            jugadorActual.intentosCarcel = 0;
            
            // Se mueve con el resultado de los dados
            moverJugador(
              jugadorActual.id,
              suma,
              jugadores,
              tableroData,
              casillasVisibles,
              calcularRangoVisible
            );
          } else {
            // No tiene dinero - queda en deuda
            const faltante = 50 - jugadorActual.dinero;
            jugadorActual.deudaBanco = (jugadorActual.deudaBanco || 0) + faltante;
            jugadorActual.dinero = 0;
            jugadorActual.enCarcel = false;
            jugadorActual.intentosCarcel = 0;
            
            alert(`No tienes dinero suficiente. Quedas en deuda por $${faltante}.`);
            
            // Aún se mueve
            moverJugador(
              jugadorActual.id,
              suma,
              jugadores,
              tableroData,
              casillasVisibles,
              calcularRangoVisible
            );
          }
        } else {
          // Primer o segundo intento fallido - pierde el turno
          const intentosRestantes = 3 - jugadorActual.intentosCarcel;
          alert(`No sacaste dobles. Te quedan ${intentosRestantes} intento(s) o puedes pagar la fianza. Pierdes este turno.`);
          
          // NO se mueve, pierde el turno
          setPuedeTirar(false);
          
          // *** IMPORTANTE: NO llamar a moverJugador aquí ***
          // El jugador pierde el turno y se queda en la misma posición
        }
      }
      
      // Guardar cambios en localStorage
      const js = getJugadoresLS();
      const idx = js.findIndex(j => j.id === jugadorActual.id);
      if (idx >= 0) {
        js[idx].enCarcel = jugadorActual.enCarcel;
        js[idx].intentosCarcel = jugadorActual.intentosCarcel;
        js[idx].dinero = jugadorActual.dinero;
        js[idx].deudaBanco = jugadorActual.deudaBanco || 0;
        replaceJugadores(js);
      }
      
    } else {
      // =================== JUEGO NORMAL ===================
      moverJugador(
        jugadorActual.id,
        suma,
        jugadores,
        tableroData,
        casillasVisibles,
        calcularRangoVisible
      );

      // 👀 Si sacó dobles en juego normal, puede tirar otra vez
      setPuedeTirar(esDoble);
    }

    // Actualizar UI
    if (typeof actualizarUI === "function") {
      await actualizarUI();
    } else {
      renderizarPerfilJugador(jugadorActual, tableroData, null);
    }

    // Mostrar acciones de la casilla actual
    if (typeof window.mostrarAccionesCasillaParaJugadorActual === "function") {
      window.mostrarAccionesCasillaParaJugadorActual();
    }

  }, 800);
}

/* ---- helpers sin cambios ---- */

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