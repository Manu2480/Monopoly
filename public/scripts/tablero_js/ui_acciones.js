// ui_acciones.js - Archivo principal refactorizado
// Orquesta las acciones de UI delegando a módulos especializados

import * as CasillaHandlers from "./casilla_handlers.js";
import * as PropertyHandlers from "./property_handlers.js";
import * as ActionValidator from "./action_validator.js";
import { crearInfoDiv, limpiarContainer } from "./ui_helpers.js";

/**
 * Limpia el contenedor de acciones
 */
export function clearAccionesCasilla() {
  const cont = document.getElementById("acciones-casilla");
  limpiarContainer(cont);
}

/**
 * Renderiza información de la casilla en el panel
 */
export function renderPanelCasilla(casilla) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  
  if (!casilla) {
    CasillaHandlers.resetMazoState();
    mazo.textContent = "⬜";
    return;
  }
  
  const tipo = casilla.type || "generic";
  const nombre = casilla.name || `Casilla ${casilla.id}`;
  let descripcion = "";
  
  switch (tipo) {
    case "property":
      descripcion += `<div><strong>Propiedad</strong></div>`;
      if (casilla.color) {
        descripcion += `<div>Color: <span style="display:inline-block;width:12px;height:12px;background:${casilla.color};border-radius:3px;margin-left:6px;vertical-align:middle;"></span></div>`;
      }
      if (casilla.price !== undefined) descripcion += `<div>Precio: $${casilla.price}</div>`;
      break;
    case "chance":
      descripcion += `<div><strong>Sorpresa (Chance)</strong></div>`;
      break;
    case "community_chest":
      descripcion += `<div><strong>Caja de Comunidad</strong></div>`;
      break;
    case "tax":
      descripcion += `<div><strong>Impuesto</strong></div>`;
      if (casilla.action && typeof casilla.action.money === "number") {
        descripcion += `<div>Monto: $${Math.abs(casilla.action.money)}</div>`;
      }
      break;
    default:
      descripcion += `<div><strong>${tipo}</strong></div>`;
  }
  
  mazo.innerHTML = `<div style="padding:8px;">
    <div style="font-weight:700; margin-bottom:6px;">${nombre}</div>
    <div style="font-size:13px;">${descripcion}</div>
  </div>`;
}

/**
 * Función principal que orquesta la mostración de acciones por casilla
 * Delega la lógica específica a los módulos correspondientes
 */
export function mostrarAccionesCasillaDOM(jugadorActual, casilla, jugadores, tableroData, callbacks = {}) {
  const cont = document.getElementById("acciones-casilla");
  if (!cont) return;
  
  cont.innerHTML = "";
  renderPanelCasilla(casilla);
  
  if (!jugadorActual) return;

  const miJug = jugadorActual;
  const propietario = ActionValidator.encontrarPropietario(casilla, jugadores);

  // Verificar si la acción ya fue resuelta para casillas obligatorias
  const accionObligatoria = ActionValidator.esAccionObligatoria(casilla, propietario, miJug);
  
  if (miJug.accionResuelta && accionObligatoria) {
    callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
    const info = crearInfoDiv("Acción de la casilla completada. Puedes pasar turno.");
    cont.appendChild(info);
    return;
  }

  // Delegar manejo según tipo de casilla
  switch (casilla.type) {
    case "jail":
      CasillaHandlers.handleJailVisit(miJug, casilla, cont, callbacks);
      break;
      
    case "go_to_jail":
      CasillaHandlers.handleGoToJail(miJug, casilla, cont, callbacks);
      break;
      
    default:
      // Si el jugador está encarcelado (independiente de la casilla)
      if (miJug.enCarcel) {
        CasillaHandlers.handlePlayerInJail(miJug, casilla, cont, callbacks);
        break;
      }
      
      // Manejo de cartas
      if (casilla.type === "chance" || casilla.type === "community_chest") {
        CasillaHandlers.handleCards(miJug, casilla, cont, callbacks, tableroData);
        break;
      }
      
      // Manejo de impuestos
      if (casilla.type === "tax" && casilla.action && typeof casilla.action.money === "number") {
        CasillaHandlers.handleTax(miJug, casilla, cont, callbacks);
        break;
      }
      
      // Manejo de propiedades y ferrocarriles
      if (casilla.type === "property" || casilla.type === "railroad") {
        handleProperty(miJug, casilla, propietario, cont, callbacks, tableroData);
        break;
      }
      
      // Default: limpiar contenido
      cont.innerHTML = "";
  }
}

/**
 * Maneja la lógica específica de propiedades
 * Delega a PropertyHandlers según el estado de la propiedad
 */
function handleProperty(jugador, casilla, propietario, cont, callbacks, tableroData) {
  if (!propietario) {
    // Propiedad sin dueño
    PropertyHandlers.handleUnownedProperty(jugador, casilla, cont, callbacks);
  } else if (propietario.id !== jugador.id) {
    // Propiedad de otro jugador - pagar renta
    PropertyHandlers.handleRentPayment(jugador, casilla, propietario, cont, callbacks);
  } else {
    // Propiedad del jugador actual - opciones de gestión
    PropertyHandlers.handleOwnedProperty(jugador, casilla, cont, callbacks, tableroData);
  }
}

/**
 * Re-exportar funciones de validación para compatibilidad
 */
export const tienePendientes = ActionValidator.tienePendientes;