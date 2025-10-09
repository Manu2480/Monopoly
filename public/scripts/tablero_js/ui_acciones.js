// ui_acciones.js - Versión instrumentada para depuración y corrección de promedio
// Reemplaza totalmente tu ui_acciones.js por este archivo.

import * as ControlCasillas from "./control_casillas.js";
import * as ControlPropiedades from "./control_propiedades.js";
import * as ValidarAcciones from "./validar_acciones.js";
import { crearInfoDiv, limpiarContainer } from "./ui_ayudas.js";
import { registrarPagoRenta, promedioRango, obtenerPagos } from "./estadisticas_renta.js";

// Fallback local por compatibilidad (no la fuente principal)
if (!window.__rentaStats) window.__rentaStats = [];

/* --------------------------- helpers / UI pequeños --------------------------- */

export function clearAccionesCasilla() {
  const cont = document.getElementById("acciones-casilla");
  limpiarContainer(cont);
}

export function renderPanelCasilla(casilla) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  if (!casilla) {
    ControlCasillas.resetMazoState();
    mazo.innerHTML = `<div style="padding:24px; text-align:center; color:#ccc; font-size:48px;"></div>`;
    return;
  }
  const nombre = casilla.name || `Casilla ${casilla.id}`;
  mazo.innerHTML = `<div style="padding:8px;"><div style="font-weight:700; margin-bottom:8px; font-size:14px; color:#333;">${nombre}</div></div>`;
}

/**
 * Actualiza el span #promedio-rango-actual leyendo el rango del DOM.
 * Registra información en consola para depuración.
 */
function actualizarPromedioDesdeDOM() {
  const rangoElem = document.getElementById("rango-casillas");
  const promedioElem = document.getElementById("promedio-rango-actual");
  if (!rangoElem || !promedioElem) { console.debug('[ui_acciones] actualizarPromedioDesdeDOM: elementos DOM no encontrados'); return; }

  setTimeout(() => {
    try {
      const textoRango = rangoElem.textContent.trim(); // e.g. "1-11" o "0-10"
      const partes = textoRango.split("-").map(s => Number(s.trim()));
      if (!(partes.length === 2 && !Number.isNaN(partes[0]) && !Number.isNaN(partes[1]))) {
        console.warn("[ui_acciones] rango no parseable:", textoRango);
        return;
      }
      let [inicio, fin] = partes;
      console.debug('[ui_acciones] calcular promedio - rango DOM', { inicio, fin });

      // Intento 1: tal cual
      let prom1 = promedioRango(inicio, fin);
      console.debug('[ui_acciones] promedioRango(inicio,fin) =', prom1);

      // Intento 2: shift -1 (UI 1-based vs datos 0-based)
      let prom2 = null;
      if (inicio > 0) {
        prom2 = promedioRango(inicio - 1, fin - 1);
        console.debug('[ui_acciones] promedioRango(inicio-1,fin-1) =', prom2);
      }

      let prom = 0;
      if (prom1 && prom1 > 0) prom = prom1;
      else if (prom2 && prom2 > 0) prom = prom2;

      // Fallback local (solo para depurar)
      if ((!prom || prom === 0) && window.__rentaStats && window.__rentaStats.length > 0) {
        console.debug('[ui_acciones] fallback window.__rentaStats', obtenerPagos ? obtenerPagos() : window.__rentaStats);
        const pagosTramo = window.__rentaStats.filter(r => r.casillaId >= inicio && r.casillaId <= fin);
        if (pagosTramo.length === 0 && inicio > 0) {
          const pagosTramo2 = window.__rentaStats.filter(r => r.casillaId >= (inicio - 1) && r.casillaId <= (fin - 1));
          if (pagosTramo2.length > 0) { const suma = pagosTramo2.reduce((s, p) => s + p.monto, 0); prom = suma / pagosTramo2.length; }
        } else if (pagosTramo.length > 0) { const suma = pagosTramo.reduce((s, p) => s + p.monto, 0); prom = suma / pagosTramo.length; }
      }

      if (!prom || prom === 0) promedioElem.textContent = `$0`;
      else promedioElem.textContent = `$${Number(prom).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      console.debug('[ui_acciones] promedio mostrado =', promedioElem.textContent);
    } catch (err) {
      console.error("[ui_acciones] actualizarPromedioDesdeDOM error:", err);
    }
  }, 8);
}

/* --------------------------- Lógica principal --------------------------- */

export function mostrarAccionesCasillaDOM(jugadorActual, casilla, jugadores, tableroData, callbacks = {}) {
  const cont = document.getElementById("acciones-casilla");
  if (!cont) return;
  cont.innerHTML = "";
  renderPanelCasilla(casilla);
  if (!jugadorActual) return;

  const miJug = jugadorActual;
  const propietario = ValidarAcciones.encontrarPropietario(casilla, jugadores);

  if (casilla.type !== "chance" && casilla.type !== "community_chest") ControlCasillas.resetMazoState();

  const accionObligatoria = ValidarAcciones.esAccionObligatoria(casilla, propietario, miJug);
  if (miJug.accionResuelta && accionObligatoria) {
    callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
    const info = crearInfoDiv("Acción de la casilla completada. Puedes pasar turno.");
    cont.appendChild(info);
    return;
  }

  if (casilla.type === "jail") { ControlCasillas.handleJailVisit(miJug, casilla, cont, callbacks); return; }
  if (casilla.type === "go_to_jail") { ControlCasillas.handleGoToJail(miJug, casilla, cont, callbacks); return; }
  if (miJug.enCarcel) { ControlCasillas.handlePlayerInJail(miJug, casilla, cont, callbacks); return; }
  if (casilla.type === "chance" || casilla.type === "community_chest") { ControlCasillas.handleCards(miJug, casilla, cont, callbacks, tableroData); return; }
  if (casilla.type === "tax" && casilla.action && typeof casilla.action.money === "number") { ControlCasillas.handleTax(miJug, casilla, cont, callbacks); return; }
  if (casilla.type === "property" || casilla.type === "railroad") { handleProperty(miJug, casilla, propietario, cont, callbacks, tableroData); return; }

  cont.innerHTML = "";
}

/**
 * Detecta y registra pagos de renta y fuerza actualización de la barra de promedio.
 * Tiene trazas exhaustivas para debugging.
 */
async function handleProperty(jugador, casilla, propietario, cont, callbacks, tableroData) {
  if (!propietario) { ControlPropiedades.handleUnownedProperty(jugador, casilla, cont, callbacks); return; }

  if (propietario.id !== jugador.id) {
    try {
      console.debug('[ui_acciones] handleProperty inicio', { casillaId: casilla.id, casillaName: casilla.name, jugadorId: jugador.id, jugadorNombre: jugador.nombre || jugador.name, propietarioId: propietario.id, propietarioNombre: propietario.nombre || propietario.name });

      const antesJugador = Number(jugador.dinero ?? 0);
      const antesProp = Number(propietario.dinero ?? 0);
      console.debug('[ui_acciones] dinero antes', { antesJugador, antesProp });

      const posibleRetorno = ControlPropiedades.handleRentPayment(jugador, casilla, propietario, cont, callbacks);
      if (posibleRetorno && typeof posibleRetorno.then === "function") await posibleRetorno;

      const despuesJugador = Number(jugador.dinero ?? 0);
      const despuesProp = Number(propietario.dinero ?? 0);
      console.debug('[ui_acciones] dinero despues', { despuesJugador, despuesProp });

      const montoPagado = Math.max(0, antesJugador - despuesJugador);
      const montoRecibido = Math.max(0, despuesProp - antesProp);
      const monto = montoPagado || montoRecibido || 0;
      console.debug('[ui_acciones] monto detectado', { montoPagado, montoRecibido, monto });

      if (monto > 0) {
        try {
          registrarPagoRenta(Number(casilla.id), Number(monto));
          console.debug('[ui_acciones] registrarPagoRenta OK', { casillaId: casilla.id, monto });
        } catch (err) {
          console.warn('[ui_acciones] registrarPagoRenta falló, fallback local', err);
          window.__rentaStats.push({ casillaId: Number(casilla.id), monto: Number(monto), ts: Date.now() });
        }

        try { console.debug('[ui_acciones] pagos actuales (modulo):', obtenerPagos ? obtenerPagos() : window.__rentaStats); } catch(e){ console.debug('[ui_acciones] obtenerPagos fallo', e); }

        actualizarPromedioDesdeDOM();
      } else {
        if (typeof posibleRetorno === "number" && posibleRetorno > 0) {
          try {
            registrarPagoRenta(Number(casilla.id), Number(posibleRetorno));
            console.debug('[ui_acciones] registrarPagoRenta desde retorno OK', posibleRetorno);
            actualizarPromedioDesdeDOM();
          } catch(e) { console.warn('[ui_acciones] fallback registrar desde retorno', e); }
        } else {
          console.debug('[ui_acciones] No se detectó pago tras handleRentPayment. Revisa control_propiedades.handleRentPayment'); 
        }
      }
    } catch (e) {
      console.error('[ui_acciones] Error registrando pago de renta:', e);
    }
    return;
  }

  ControlPropiedades.handleOwnedProperty(jugador, casilla, cont, callbacks, tableroData);
}

export const tienePendientes = ValidarAcciones.tienePendientes;
