// casilla_handlers.js
// Manejadores específicos para cada tipo de casilla del Monopoly
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";
import { obtenerCarta, voltearCartaEnPanel, resetPanelCarta } from "./cartas_tablero.js";

/**
 * Estado global del mazo abierto: evita voltear múltiples cartas a la vez.
 * Ahora se reinicia automáticamente al cambiar de casilla/jugador.
 */
let mazoAbierto = false;

/**
 * Marca y persiste que el jugador resolvió la acción de su casilla.
 */
function marcarAccionResuelta(miJug) {
  try {
    miJug.accionResuelta = true;
    const js = getJugadoresLS();
    const idx = js.findIndex(j => j.id === miJug.id);
    if (idx >= 0) {
      js[idx].accionResuelta = true;
      replaceJugadores(js);
    }
  } catch (e) {
    console.error("Error persisting accionResuelta:", e);
  }
}

/**
 * Manejador para casillas de cárcel (visita)
 */
export function handleJailVisit(jugador, casilla, cont, callbacks) {
  const info = document.createElement("div");
  info.style.padding = "8px";
  info.textContent = "Estás en la cárcel (visita). No hay restricciones.";
  cont.appendChild(info);
  callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
}

/**
 * Manejador para casillas "Ir a la cárcel"
 */
export function handleGoToJail(jugador, casilla, cont, callbacks) {
  jugador.enCarcel = true;
  jugador.intentosCarcel = 0;
  
  const js = getJugadoresLS();
  const idx = js.findIndex(j => j.id === jugador.id);
  if (idx >= 0) {
    js[idx].enCarcel = true;
    js[idx].intentosCarcel = 0;
    replaceJugadores(js);
  }
  
  const info = document.createElement("div");
  info.style.padding = "8px";
  info.textContent = "¡Vas a la cárcel! En tu siguiente turno podrás intentar salir.";
  cont.appendChild(info);
  
  marcarAccionResuelta(jugador);
  callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
}

/**
 * Manejador para cuando el jugador está encarcelado
 */
export function handlePlayerInJail(jugador, casilla, cont, callbacks) {
  callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();

  // Inicializar intentos si no existe
  if (typeof jugador.intentosCarcel !== 'number') {
    jugador.intentosCarcel = 0;
  }

  const container = document.createElement("div");
  container.style.padding = "8px";
  container.style.border = "2px solid #ff6b6b";
  container.style.borderRadius = "8px";
  container.style.backgroundColor = "#ffebee";

  // Título
  const titulo = document.createElement("div");
  titulo.style.fontWeight = "bold";
  titulo.style.marginBottom = "8px";
  titulo.style.color = "#c62828";
  titulo.textContent = "🔒 EN LA CÁRCEL";
  container.appendChild(titulo);

  // Estado actual
  const estado = document.createElement("div");
  estado.style.marginBottom = "12px";
  estado.style.fontSize = "13px";
  
  if (jugador.intentosCarcel === 0) {
    estado.textContent = "Tienes 3 oportunidades para sacar dobles y salir, o puedes pagar la fianza.";
  } else {
    const restantes = 3 - jugador.intentosCarcel;
    if (restantes > 0) {
      estado.textContent = `Intento ${jugador.intentosCarcel} fallido. Te quedan ${restantes} oportunidad(es).`;
    } else {
      estado.textContent = "Has agotado los 3 intentos. Debes pagar la fianza.";
    }
  }
  container.appendChild(estado);

  // Opciones disponibles
  const opciones = document.createElement("div");
  opciones.style.display = "flex";
  opciones.style.flexDirection = "column";
  opciones.style.gap = "8px";

  // Botón pagar fianza
  const dineroDisponible = Number(jugador.dinero) || 0;
  const puedePermitirse = dineroDisponible >= 50;
  
  const pagarBtn = document.createElement("button");
  pagarBtn.className = "accion-btn";
  pagarBtn.textContent = `Pagar fianza $50 ${puedePermitirse ? '' : '(Sin dinero suficiente)'}`;
  pagarBtn.style.backgroundColor = puedePermitirse ? "#4caf50" : "#ff9800";
  pagarBtn.style.color = "white";
  
  pagarBtn.addEventListener("click", () => {
    if (dineroDisponible >= 50) {
      jugador.dinero -= 50;
      jugador.enCarcel = false;
      jugador.intentosCarcel = 0;
    } else {
      // Pagar con deuda
      const faltante = 50 - dineroDisponible;
      jugador.deudaBanco = (jugador.deudaBanco || 0) + faltante;
      jugador.dinero = 0;
      jugador.enCarcel = false;
      jugador.intentosCarcel = 0;
    }
    
    // Actualizar localStorage
    const js = getJugadoresLS();
    const idx = js.findIndex(j => j.id === jugador.id);
    if (idx >= 0) {
      js[idx].dinero = jugador.dinero;
      js[idx].deudaBanco = jugador.deudaBanco || 0;
      js[idx].enCarcel = false;
      js[idx].intentosCarcel = 0;
      replaceJugadores(js);
    }
    
    marcarAccionResuelta(jugador);
    callbacks.actualizarUI && callbacks.actualizarUI();
    callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
    
    const mensaje = puedePermitirse 
      ? "Has pagado la fianza. ¡Eres libre! Puedes tirar dados normalmente."
      : `Has pagado la fianza (quedas en deuda por $${50 - dineroDisponible}). ¡Eres libre!`;
    alert(mensaje);
    cont.innerHTML = "";
  });

  opciones.appendChild(pagarBtn);

  // Información sobre tirar dados
  if (jugador.intentosCarcel < 3) {
    const infoDados = document.createElement("div");
    infoDados.style.fontSize = "12px";
    infoDados.style.color = "#666";
    infoDados.style.fontStyle = "italic";
    infoDados.textContent = "O tira los dados para intentar sacar dobles y salir gratis.";
    opciones.appendChild(infoDados);
  } else {
    const avisoFinal = document.createElement("div");
    avisoFinal.style.fontSize = "12px";
    avisoFinal.style.color = "#d32f2f";
    avisoFinal.style.fontWeight = "bold";
    avisoFinal.textContent = "Ya no puedes intentar con dados. Debes pagar la fianza.";
    opciones.appendChild(avisoFinal);
  }

  container.appendChild(opciones);
  cont.appendChild(container);
}

/**
 * Manejador para cartas (chance / community_chest)
 */
export function handleCards(jugador, casilla, cont, callbacks, tableroData) {
  const tipoMazo = casilla.type;
  
  // Si ya hay una carta abierta para este jugador específico, no mostrar el botón
  if (mazoAbierto && jugador.accionResuelta === false) {
    callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
    return; // La carta ya está visible, no agregar más botones
  }
  
  const voltearBtn = document.createElement("button");
  voltearBtn.className = "accion-btn";
  voltearBtn.textContent = "Voltear carta";
  voltearBtn.disabled = mazoAbierto;
  voltearBtn.title = mazoAbierto ? "Ya hay una carta abierta." : "";
  
  voltearBtn.addEventListener("click", () => {
    if (mazoAbierto) return;
    
    const carta = obtenerCarta(tipoMazo, tableroData);
    if (!carta) { 
      alert("No hay cartas en el mazo."); 
      // Marcar como resuelta aunque no haya carta
      marcarAccionResuelta(jugador);
      callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
      return; 
    }

    mazoAbierto = true;
    callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
    voltearCartaEnPanel(carta);
    cont.innerHTML = ""; // Limpiar el botón voltear

    if (carta.action && typeof carta.action.money === "number") {
      const monto = carta.action.money;
      const texto = monto < 0 ? `Pagar ${Math.abs(monto)}` : `Recibir ${Math.abs(monto)}`;

      const aplicarBtn = document.createElement("button");
      aplicarBtn.className = "accion-btn";
      aplicarBtn.textContent = texto;
      
      aplicarBtn.addEventListener("click", () => {
        aplicarBtn.disabled = true; // Evitar clicks múltiples
        
        if (monto < 0) {
          // Pagar dinero
          const res = ACC.intentarPagar(jugador.id, Math.abs(monto));
          if (res.ok) {
            marcarAccionResuelta(jugador);
            finalizarCarta(callbacks, cont);
            alert(`Has pagado ${Math.abs(monto)}.`);
          } else {
            if (res.reason === "insuficiente") {
              alert("No tienes suficiente dinero. Vende o hipoteca propiedades.");
              aplicarBtn.disabled = false; // Re-habilitar para reintentar
              callbacks.actualizarUI && callbacks.actualizarUI();
            } else {
              alert("Error al pagar: " + res.reason);
              finalizarCarta(callbacks, cont);
            }
          }
        } else {
          // Recibir dinero
          const js = getJugadoresLS();
          const j = js.find(x => x.id === jugador.id);
          if (j) {
            j.dinero = (Number(j.dinero) || 0) + Number(monto);
            replaceJugadores(js);
            marcarAccionResuelta(jugador);
            finalizarCarta(callbacks, cont);
            alert(`Has recibido ${monto}.`);
          } else {
            alert("Error interno: jugador no encontrado.");
            finalizarCarta(callbacks, cont);
          }
        }
      });
      
      cont.appendChild(aplicarBtn);
    } else {
      // Carta sin acción monetaria - solo informativa
      const aceptar = document.createElement("button");
      aceptar.className = "accion-btn";
      aceptar.textContent = "Aceptar";
      
      aceptar.addEventListener("click", () => {
        marcarAccionResuelta(jugador);
        finalizarCarta(callbacks, cont);
      });
      
      cont.appendChild(aceptar);
    }
  });
  
  cont.appendChild(voltearBtn);
  if (mazoAbierto) callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
}

/**
 * Función helper para finalizar el manejo de cartas
 */
function finalizarCarta(callbacks, cont) {
  mazoAbierto = false;
  cont.innerHTML = "";
  resetPanelCarta();
  callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
  callbacks.actualizarUI && callbacks.actualizarUI();
}

/**
 * Manejador para impuestos (tax)
 */
export function handleTax(jugador, casilla, cont, callbacks) {
  const monto = Math.abs(casilla.action.money);
  
  if (casilla.action.money < 0) {
    callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
    
    const pagarBtn = document.createElement("button");
    pagarBtn.className = "accion-btn";
    pagarBtn.textContent = `Pagar $${monto}`;
    
    pagarBtn.addEventListener("click", () => {
      const res = ACC.intentarPagar(jugador.id, monto);
      if (res.ok) {
        marcarAccionResuelta(jugador);
        callbacks.actualizarUI && callbacks.actualizarUI();
        callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        cont.innerHTML = "";
      } else {
        if (res.reason === "insuficiente") {
          alert("Insuficiente. Vende o hipoteca propiedades.");
          callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
          callbacks.actualizarUI && callbacks.actualizarUI();
        } else {
          alert("Error: " + res.reason);
          callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        }
      }
    });
    
    cont.appendChild(pagarBtn);
  } else {
    const cobrar = document.createElement("button");
    cobrar.className = "accion-btn";
    cobrar.textContent = `Cobrar $${monto}`;
    
    cobrar.addEventListener("click", () => {
      const js = getJugadoresLS();
      const j = js.find(x => x.id === jugador.id);
      if (j) {
        j.dinero = (Number(j.dinero) || 0) + monto;
        replaceJugadores(js);
        marcarAccionResuelta(jugador);
        callbacks.actualizarUI && callbacks.actualizarUI();
      }
      callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
      cont.innerHTML = "";
    });
    
    cont.appendChild(cobrar);
  }
}

// Resetear estado del mazo cuando sea necesario
export function resetMazoState() {
  mazoAbierto = false;
}