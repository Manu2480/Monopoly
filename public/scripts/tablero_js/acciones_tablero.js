// acciones_tablero.js
import { getJugadoresLS, updateJugador, findJugadorById, replaceJugadores } from "./jugadores_estado.js";

/* Helpers: precios / cálculo renta basados en tu JSON */
export function precioCasa(casilla) {
  // Monopoly estándar: no viene houseCost en tu JSON; estimamos houseCost = 0.5 * price / 4
  const price = casilla.price ?? 0;
  return casilla.houseCost ?? Math.max(1, Math.round((price * 0.5) / 4));
}
export function precioHotel(casilla) {
  // hotel cost = precioCasa (convert 4 casas en hotel)
  return precioCasa(casilla);
}

/* ---------- Intentar pagar (cartas/renta/impuestos) ----------
   Si tiene suficiente dinero: descuenta y devuelve ok:true.
   Si no: pone jugador.dinero = 0 y jugador.deudaBanco += faltante, devuelve ok:false y faltante.
*/
export function intentarPagar(jugadorId, monto) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "Jugador no encontrado" };

  const actual = jugador.dinero ?? 0;
  if (actual >= monto) {
    jugador.dinero = actual - monto;
    updateJugador(jugador);
    return { ok: true, jugador, amount: monto };
  } else {
    const faltante = monto - actual;
    jugador.deudaBanco = (jugador.deudaBanco || 0) + faltante;
    jugador.dinero = 0;
    updateJugador(jugador);
    return { ok: false, reason: "insuficiente", faltante, jugador };
  }
}

/* ---------- Comprar propiedad (si tiene dinero) ---------- */
export function comprarPropiedad(jugadorId, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const precio = casilla.price ?? 0;
  if ((jugador.dinero ?? 0) < precio) return { ok: false, reason: "sin-dinero" };

  jugador.dinero -= precio;
  if (!jugador.propiedades) jugador.propiedades = [];
  jugador.propiedades.push({
    idPropiedad: casilla.id,
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
  const prop = (jugador.propiedades || []).find(p => p.idPropiedad === casilla.id);
  if (!prop) return { ok: false, reason: "propiedad-no-encontrada" };

  const hipVal = casilla.mortgage ?? Math.floor((casilla.price ?? 0) / 2);

  if (!prop.hipotecado) {
    prop.hipotecado = true;
    jugador.dinero = (jugador.dinero || 0) + hipVal;
    updateJugador(jugador);
    return { ok: true, action: "hipotecar", jugador, monto: hipVal };
  } else {
    const costo = Math.ceil(hipVal * 1.1);
    if ((jugador.dinero || 0) < costo) return { ok: false, reason: "sin-dinero" };
    prop.hipotecado = false;
    jugador.dinero -= costo;
    updateJugador(jugador);
    return { ok: true, action: "deshipotecar", jugador, monto: costo };
  }
}

/* ---------- Monopolio ---------- */
export function tieneMonopolio(jugador, tableroData, idPropiedad) {
  const casilla = tableroData.casillas.find(c => c.id === idPropiedad);
  if (!casilla || !casilla.color) return false;
  const color = casilla.color;
  // todas las casillas del color
  const todas = tableroData.casillas.filter(c => c.color === color).map(c => c.id);
  const ids = (jugador.propiedades || []).map(p => p.idPropiedad);
  return todas.every(id => ids.includes(id));
}

/* ---------- Comprar casa ---------- */
export function comprarCasa(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!tieneMonopolio(jugador, tableroData, casilla.id)) return { ok: false, reason: "sin-monopolio" };

  const p = (jugador.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
  if (!p) return { ok: false, reason: "propiedad-no-encontrada" };
  if ((p.casas || 0) >= 4) return { ok: false, reason: "ya-4-casas" };

  const costo = precioCasa(casilla);
  if ((jugador.dinero || 0) < costo) return { ok: false, reason: "sin-dinero" };

  jugador.dinero -= costo;
  p.casas = (p.casas || 0) + 1;
  updateJugador(jugador);
  return { ok: true, jugador, costo, action: "comprar-casa" };
}

/* ---------- Comprar hotel ---------- */
export function comprarHotel(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!tieneMonopolio(jugador, tableroData, casilla.id)) return { ok: false, reason: "sin-monopolio" };

  const p = (jugador.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
  if (!p) return { ok: false, reason: "propiedad-no-encontrada" };
  if ((p.casas || 0) < 4) return { ok: false, reason: "menos-4-casas" };

  const costo = precioHotel(casilla);
  if ((jugador.dinero || 0) < costo) return { ok: false, reason: "sin-dinero" };

  p.casas = 0;
  p.hotel = 1;
  jugador.dinero -= costo;
  updateJugador(jugador);
  return { ok: true, jugador, costo, action: "comprar-hotel" };
}

/* ---------- Vender casa / hotel ---------- */
export function venderCasa(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const p = (jugador.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
  if (!p || (p.casas || 0) <= 0) return { ok: false, reason: "no-casas" };
  const venta = Math.ceil(precioCasa(casilla) / 2);
  p.casas -= 1;
  jugador.dinero = (jugador.dinero || 0) + venta;
  updateJugador(jugador);
  return { ok: true, jugador, venta };
}

export function venderHotel(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  const p = (jugador.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
  if (!p || (p.hotel || 0) <= 0) return { ok: false, reason: "no-hotel" };
  const venta = Math.ceil(precioHotel(casilla) / 2);
  p.hotel = 0;
  jugador.dinero = (jugador.dinero || 0) + venta;
  updateJugador(jugador);
  return { ok: true, jugador, venta };
}

/* ---------- Vender propiedad ---------- */
export function puedeVenderPropiedad(jugador, tableroData, casilla) {
  const color = casilla?.color;
  if (!color) return true;
  const idsDelColor = tableroData.casillas.filter(c => c.color === color).map(c => c.id);
  return !( (jugador.propiedades || []).some(p => idsDelColor.includes(p.idPropiedad) && ((p.casas||0) > 0 || (p.hotel||0) > 0)) );
}

export function venderPropiedad(jugadorId, tableroData, casilla) {
  const jugador = findJugadorById(jugadorId);
  if (!jugador) return { ok: false, reason: "jugador-no-encontrado" };
  if (!puedeVenderPropiedad(jugador, tableroData, casilla)) return { ok: false, reason: "hay-construcciones" };

  const valor = Math.floor((casilla.price || 0) / 2);
  jugador.propiedades = (jugador.propiedades || []).filter(p => p.idPropiedad !== casilla.id);
  jugador.dinero = (jugador.dinero || 0) + valor;
  updateJugador(jugador);
  return { ok: true, jugador, valor };
}

/* ---------- Calcular renta de una propiedad cuando otro cae ---------- */
export function calcularRentaParaCasilla(casilla, propietario) {
  // si la casilla es railroad, la renta depende de cuantos ferrocarriles posee el propietario
  if (casilla.type === "railroad") {
    const count = (propietario.propiedades || []).filter(p => {
      const c = propietario; // placeholder
      return false;
    }).length;
    // NOTA: para railroads, la función real debe contar cuántos railroads tiene el dueño
    // pero aquí solo devolvemos base aproximada si no hay estructura: fallback al rent["1"]
    const rents = casilla.rent || {};
    return rents["1"] ?? Math.max(1, Math.floor((casilla.price || 0) * 0.1));
  }

  // propiedades normales:
  const propData = casilla.rent ?? {};
  // encontrar la propiedad del dueño para saber casas/hotel
  // Este cálculo requiere que el caller le pase la info de cuantas casas/hotel hay (porque la casilla no tiene esa info)
  // Por convención, el caller debe calcular la renta usando la info del propietario (propietario.propiedades)
  return propData.base ?? Math.max(1, Math.floor((casilla.price || 0) * 0.1));
}
