// ui_acciones.js - Archivo principal refactorizado
// Orquesta las acciones de UI delegando a módulos especializados

import * as ControlCasillas from "./control_casillas.js";
import * as ControlPropiedades from "./control_propiedades.js";
import * as ValidarAcciones from "./validar_acciones.js";
import { crearInfoDiv, limpiarContainer } from "./ui_ayudas.js";

/**
 * Iconos SVG para las casillas
 */
const CASILLA_ICONS = {
  card: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>`,
  jail: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z"/></svg>`,
  police: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.18l7 3.12V11c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V7.3l7-3.12zM7 11h2v6H7zm4-2h2v8h-2zm4 2h2v6h-2z"/></svg>`,
  start: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  parking: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/></svg>`,
  train: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  money: `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>`
};

/**
 * Limpia el contenedor de acciones
 */
export function clearAccionesCasilla() {
  const cont = document.getElementById("acciones-casilla");
  limpiarContainer(cont);
}

/**
 * Renderiza información de la casilla en el panel
 * ✅ Usa iconos SVG en vez de emojis
 */
export function renderPanelCasilla(casilla) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  
  if (!casilla) {
    ControlCasillas.resetMazoState();
    mazo.innerHTML = `<div style="padding:24px; text-align:center; color:#ccc; font-size:48px;">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="opacity:0.3">
        <rect width="24" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>`;
    return;
  }
  
  const tipo = casilla.type || "generic";
  const nombre = casilla.name || `Casilla ${casilla.id}`;
  let descripcion = "";
  
  switch (tipo) {
    case "property":
      descripcion += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <div style="color:#666;">${CASILLA_ICONS.home}</div>
        <div><strong>Propiedad</strong></div>
      </div>`;
      if (casilla.color) {
        descripcion += `<div style="margin-top:8px;">Color: <span style="display:inline-block;width:16px;height:16px;background:${casilla.color};border-radius:3px;margin-left:6px;vertical-align:middle;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span></div>`;
      }
      if (casilla.price !== undefined) descripcion += `<div style="margin-top:6px; font-size:14px; color:#4caf50; font-weight:600;">Precio: $${casilla.price}</div>`;
      break;
      
    case "chance":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#ff9800; margin-bottom:8px;">${CASILLA_ICONS.card}</div>
        <div style="font-weight:600; color:#ff9800; font-size:15px;">Sorpresa</div>
        <div style="font-size:11px; color:#999; margin-top:4px; font-style:italic;">Voltea una carta</div>
      </div>`;
      break;
      
    case "community_chest":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#2196f3; margin-bottom:8px;">${CASILLA_ICONS.gift}</div>
        <div style="font-weight:600; color:#2196f3; font-size:15px;">Caja Comunidad</div>
        <div style="font-size:11px; color:#999; margin-top:4px; font-style:italic;">Voltea una carta</div>
      </div>`;
      break;
      
    case "tax":
      descripcion += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <div style="color:#f44336;">${CASILLA_ICONS.money}</div>
        <div><strong>Impuesto</strong></div>
      </div>`;
      if (casilla.action && typeof casilla.action.money === "number") {
        descripcion += `<div style="margin-top:8px; font-size:14px; color:#f44336; font-weight:600;">Monto: $${Math.abs(casilla.action.money)}</div>`;
      }
      break;
      
    case "railroad":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#333; margin-bottom:8px;">${CASILLA_ICONS.train}</div>
        <div style="font-weight:600; font-size:15px;">Ferrocarril</div>
        ${casilla.price !== undefined ? `<div style="font-size:12px; margin-top:6px; color:#4caf50; font-weight:600;">Precio: $${casilla.price}</div>` : ''}
      </div>`;
      break;
      
    case "utility":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#ffc107; margin-bottom:8px;">${CASILLA_ICONS.lightbulb}</div>
        <div style="font-weight:600; font-size:15px;">Servicio Público</div>
        ${casilla.price !== undefined ? `<div style="font-size:12px; margin-top:6px; color:#4caf50; font-weight:600;">Precio: $${casilla.price}</div>` : ''}
      </div>`;
      break;
      
    case "jail":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#666; margin-bottom:8px;">${CASILLA_ICONS.jail}</div>
        <div style="font-weight:600; font-size:15px;">Cárcel</div>
        <div style="font-size:11px; color:#999; margin-top:4px;">(Solo visita)</div>
      </div>`;
      break;
      
    case "go_to_jail":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#f44336; margin-bottom:8px;">${CASILLA_ICONS.police}</div>
        <div style="font-weight:600; color:#f44336; font-size:15px;">¡A la Cárcel!</div>
        <div style="font-size:11px; color:#999; margin-top:4px;">Vas directo a prisión</div>
      </div>`;
      break;
      
    case "go":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#4caf50; margin-bottom:8px;">${CASILLA_ICONS.start}</div>
        <div style="font-weight:600; color:#4caf50; font-size:15px;">Salida</div>
        <div style="font-size:11px; color:#999; margin-top:4px;">Cobra $200 al pasar</div>
      </div>`;
      break;
      
    case "parking":
      descripcion += `<div style="text-align:center; padding:12px;">
        <div style="color:#9c27b0; margin-bottom:8px;">${CASILLA_ICONS.parking}</div>
        <div style="font-weight:600; font-size:15px;">Estacionamiento</div>
        <div style="font-size:11px; color:#999; margin-top:4px;">Gratuito</div>
      </div>`;
      break;
      
    default:
      descripcion += `<div><strong>${tipo}</strong></div>`;
  }
  
  // Para casillas especiales con iconos, no mostrar el nombre arriba
  const tiposConIconos = ["chance", "community_chest", "jail", "go_to_jail", "go", "parking", "railroad", "utility"];
  if (tiposConIconos.includes(tipo)) {
    mazo.innerHTML = `<div style="padding:8px;">${descripcion}</div>`;
  } else {
    mazo.innerHTML = `<div style="padding:8px;">
      <div style="font-weight:700; margin-bottom:8px; font-size:14px; color:#333;">${nombre}</div>
      <div style="font-size:13px;">${descripcion}</div>
    </div>`;
  }
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
  const propietario = ValidarAcciones.encontrarPropietario(casilla, jugadores);

  // Resetear estado del mazo al cambiar de jugador/casilla si no hay cartas pendientes
  if (casilla.type !== "chance" && casilla.type !== "community_chest") {
    ControlCasillas.resetMazoState();
  }

  // Verificar si la acción ya fue resuelta para casillas obligatorias
  const accionObligatoria = ValidarAcciones.esAccionObligatoria(casilla, propietario, miJug);
  
  if (miJug.accionResuelta && accionObligatoria) {
    callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
    const info = crearInfoDiv("Acción de la casilla completada. Puedes pasar turno.");
    cont.appendChild(info);
    return;
  }

  // Delegar manejo según tipo de casilla
  switch (casilla.type) {
    case "jail":
      ControlCasillas.handleJailVisit(miJug, casilla, cont, callbacks);
      break;
      
    case "go_to_jail":
      ControlCasillas.handleGoToJail(miJug, casilla, cont, callbacks);
      break;
      
    default:
      // Si el jugador está encarcelado (independiente de la casilla)
      if (miJug.enCarcel) {
        ControlCasillas.handlePlayerInJail(miJug, casilla, cont, callbacks);
        break;
      }
      
      // Manejo de cartas
      if (casilla.type === "chance" || casilla.type === "community_chest") {
        ControlCasillas.handleCards(miJug, casilla, cont, callbacks, tableroData);
        break;
      }
      
      // Manejo de impuestos
      if (casilla.type === "tax" && casilla.action && typeof casilla.action.money === "number") {
        ControlCasillas.handleTax(miJug, casilla, cont, callbacks);
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
 * Delega a ControlPropiedades según el estado de la propiedad
 */
function handleProperty(jugador, casilla, propietario, cont, callbacks, tableroData) {
  if (!propietario) {
    // Propiedad sin dueño
    ControlPropiedades.handleUnownedProperty(jugador, casilla, cont, callbacks);
  } else if (propietario.id !== jugador.id) {
    // Propiedad de otro jugador - pagar renta
    ControlPropiedades.handleRentPayment(jugador, casilla, propietario, cont, callbacks);
  } else {
    // Propiedad del jugador actual - opciones de gestión
    ControlPropiedades.handleOwnedProperty(jugador, casilla, cont, callbacks, tableroData);
  }
}

/**
 * Re-exportar funciones de validación para compatibilidad
 */
export const tienePendientes = ValidarAcciones.tienePendientes;