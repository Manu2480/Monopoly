// acciones_tablero.js
import { getJugadoresLS, updateJugador, findJugadorById, replaceJugadores } from "./jugadores_estado.js";

/* ---------- Helpers precios ---------- */
export function precioCasa(casilla) {
  const price = Number(casilla?.price || 0);
  return Number(casilla?.houseCost ?? Math.max(1, Math.round((price * 0.5) / 4)));
}
export function precioHotel(casilla) {
  return precioCasa(casilla);
}

/* ---------- Pagar / recibir dinero ---------- */
export function intentarPagar(jugadorId, monto) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "Jugador no encontrado" };

  const actual = Number(jugador.dinero || 0);
  if (actual >= monto) {
    jugador.dinero = actual - monto;
    updateJugador(jugador);
    return { ok: true, jugador, amount: monto };
  } else {
    const faltante = monto - actual;
    jugador.deudaBanco = (Number(jugador.deudaBanco) || 0) + faltante;
    jugador.dinero = 0;
    updateJugador(jugador);
    return { ok: false, reason: "insuficiente", faltante, jugador };
  }
}

/* ---------- Comprar propiedad ---------- */
export function comprarPropiedad(jugadorId, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const precio = Number(casilla?.price || 0);
  if ((Number(jugador.dinero) || 0) < precio) return { ok: false, reason: "sin-dinero" };

  jugador.dinero = (Number(jugador.dinero) || 0) - precio;
  if (!Array.isArray(jugador.propiedades)) jugador.propiedades = [];
  jugador.propiedades.push({
    idPropiedad: Number(casilla.id),
    casas: 0,
    hotel: 0,
    hipotecado: false
  });
  updateJugador(jugador);
  return { ok: true, jugador, precio };
}

/* ---------- Hipotecar / Deshipotecar ---------- */
export function toggleHipoteca(jugadorId, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const prop = (jugador.propiedades || []).find(p => Number(p.idPropiedad) === Number(casilla.id));
  if (!prop) return { ok: false, reason: "propiedad-no-encontrada" };

  const hipVal = Number(casilla?.mortgage ?? Math.floor((Number(casilla?.price || 0)) / 2));

  if (!prop.hipotecado) {
    prop.hipotecado = true;
    jugador.dinero = (Number(jugador.dinero) || 0) + hipVal;
    updateJugador(jugador);
    return { ok: true, action: "hipotecar", jugador, monto: hipVal };
  } else {
    const costo = Math.ceil(hipVal * 1.1);
    if ((Number(jugador.dinero) || 0) < costo) return { ok: false, reason: "sin-dinero" };
    prop.hipotecado = false;
    jugador.dinero = (Number(jugador.dinero) || 0) - costo;
    updateJugador(jugador);
    return { ok: true, action: "deshipotecar", jugador, monto: costo };
  }
}

/* ---------- Monopolio ---------- */
export function tieneMonopolio(jugador, tableroData, idPropiedad) {
  const casilla = tableroData?.casillas?.find(c => Number(c.id) === Number(idPropiedad));
  if (!casilla || !casilla.color) return false;
  const color = casilla.color;
  const ids = tableroData.casillas.filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase()).map(c => Number(c.id));
  if (ids.length === 0) return false;
  const idsJugador = (jugador.propiedades || []).map(p => Number(p.idPropiedad));
  return ids.every(id => idsJugador.includes(Number(id)));
}

/* ---------- Propiedades totales del color (utilidad) ---------- */
export function propiedadesTotalesDelColor(tableroData, color) {
  if (!tableroData || !Array.isArray(tableroData.casillas) || !color) return 0;
  return tableroData.casillas.filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase()).length;
}

// acciones_tablero.js

/**
 * Comprueba si en las propiedades del 'color' hay casas u hoteles (cualquier propiedad del color).
 * Retorna true si existe al menos una construcción (casas>0 o hotel>0).
 */
export function tieneConstruccionesEnColor(jugador, tableroData, color) {
  if (!color || !tableroData || !Array.isArray(tableroData.casillas)) return false;
  const idsColor = tableroData.casillas
    .filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase())
    .map(c => Number(c.id));
  if (!idsColor || idsColor.length === 0) return false;
  const propsDelColor = (jugador.propiedades || []).filter(p => idsColor.includes(Number(p.idPropiedad)));
  // Si no posee todas las propiedades no importa: si alguna propiedad que posee del color tiene construcciones,
  // igualmente retorna true (condición para bloquear hipoteca).
  return propsDelColor.some(pp => (Number(pp.casas) || 0) > 0 || (Number(pp.hotel) || 0) > 0);
}


/* ---------- TodasPropiedadesCon4 (considera hotel como válida) ---------- */
export function todasPropiedadesCon4(jugador, tableroData, color) {
  if (!color || !tableroData || !Array.isArray(tableroData.casillas)) return false;
  const idsColor = tableroData.casillas
    .filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase())
    .map(c => Number(c.id));
  if (!idsColor || idsColor.length === 0) return false;

  const propsDelColor = (jugador.propiedades || []).filter(p => idsColor.includes(Number(p.idPropiedad)));
  if (propsDelColor.length !== idsColor.length) return false;

  // Válida si cada propiedad tiene 4 casas o ya tiene hotel
  return propsDelColor.every(p => (Number(p.casas) || 0) >= 4 || (Number(p.hotel) || 0) >= 1);
}

/* ---------- Comprar casa ---------- */
export function comprarCasa(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!tieneMonopolio(jugador, tableroData, casilla.id)) return { ok: false, reason: "sin-monopolio" };

  const p = (jugador.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id));
  if (!p) return { ok: false, reason: "propiedad-no-encontrada" };
  p.casas = Number(p.casas || 0);
  if (p.casas >= 4) return { ok: false, reason: "ya-4-casas" };

  const costo = precioCasa(casilla);
  if ((Number(jugador.dinero) || 0) < costo) return { ok: false, reason: "sin-dinero" };

  jugador.dinero = (Number(jugador.dinero) || 0) - costo;
  p.casas = p.casas + 1;
  updateJugador(jugador);
  return { ok: true, jugador, costo, action: "comprar-casa" };
}

/* ---------- Comprar hotel (exige todas propiedades del color con 4 casas o hotel) ---------- */
export function comprarHotel(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!tieneMonopolio(jugador, tableroData, casilla.id)) return { ok: false, reason: "sin-monopolio" };

  const p = (jugador.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id));
  if (!p) return { ok: false, reason: "propiedad-no-encontrada" };
  p.casas = Number(p.casas || 0);
  p.hotel = Number(p.hotel || 0);
  if (p.hotel >= 1) return { ok: false, reason: "ya-hotel" };

  // Verificar que todas las propiedades del color tengan 4 casas o hotel
  const color = casilla.color;
  if (color) {
    const idsColor = tableroData.casillas.filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase()).map(c => Number(c.id));
    const propsDelColor = (jugador.propiedades || []).filter(pp => idsColor.includes(Number(pp.idPropiedad)));
    if (propsDelColor.length !== idsColor.length) return { ok: false, reason: "no-tiene-todas-propiedades-del-color" };
    const todasValidas = propsDelColor.every(pp => (Number(pp.casas) || 0) >= 4 || (Number(pp.hotel) || 0) >= 1);
    if (!todasValidas) return { ok: false, reason: "no-todas-con-4-casas-o-hotel" };
  }

  const costo = precioHotel(casilla);
  if ((Number(jugador.dinero) || 0) < costo) return { ok: false, reason: "sin-dinero" };

  // convertir: quitar 4 casas en la propiedad objetivo y poner hotel=1
  p.casas = 0;
  p.hotel = 1;
  jugador.dinero = (Number(jugador.dinero) || 0) - costo;
  updateJugador(jugador);
  return { ok: true, jugador, costo, action: "comprar-hotel" };
}

/* ---------- Vender casa / hotel ---------- */
export function venderCasa(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const p = (jugador.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id));
  if (!p || (Number(p.casas) || 0) <= 0) return { ok: false, reason: "no-casas" };
  const venta = Math.ceil(precioCasa(casilla) / 2);
  p.casas = (Number(p.casas) || 0) - 1;
  jugador.dinero = (Number(jugador.dinero) || 0) + venta;
  updateJugador(jugador);
  return { ok: true, jugador, venta };
}

export function venderHotel(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const p = (jugador.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id));
  if (!p || (Number(p.hotel) || 0) <= 0) return { ok: false, reason: "no-hotel" };
  const venta = Math.ceil(precioHotel(casilla) / 2);
  p.hotel = 0;
  jugador.dinero = (Number(jugador.dinero) || 0) + venta;
  updateJugador(jugador);
  return { ok: true, jugador, venta };
}

/* ---------- Vender propiedad ---------- */
export function puedeVenderPropiedad(jugador, tableroData, casilla) {
  const color = casilla?.color;
  if (!color) return true;
  const idsDelColor = tableroData.casillas.filter(c => c.color && String(c.color).toLowerCase() === String(color).toLowerCase()).map(c => Number(c.id));
  return !((jugador.propiedades || []).some(p => idsDelColor.includes(Number(p.idPropiedad)) && ((Number(p.casas)||0) > 0 || (Number(p.hotel)||0) > 0)));
}

export function venderPropiedad(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!puedeVenderPropiedad(jugador, tableroData, casilla)) return { ok: false, reason: "hay-construcciones" };

  const valor = Math.floor((Number(casilla.price) || 0) / 2);
  jugador.propiedades = (jugador.propiedades || []).filter(p => Number(p.idPropiedad) !== Number(casilla.id));
  jugador.dinero = (Number(jugador.dinero) || 0) + valor;
  updateJugador(jugador);
  return { ok: true, jugador, valor };
}

/* ---------- Calcular renta (fallback simple) ---------- */
export function calcularRentaParaCasilla(casilla, propietario) {
  if (!casilla) return 0;
  if (casilla.type === "railroad") {
    const rents = casilla.rent || {};
    return rents["1"] ?? Math.max(1, Math.floor((Number(casilla.price) || 0) * 0.1));
  }
  return casilla.rent?.base ?? Math.max(1, Math.floor((Number(casilla.price) || 0) * 0.1));
}

/* ---------- Exports (ya hechos por 'export function' arriba) ---------- */
