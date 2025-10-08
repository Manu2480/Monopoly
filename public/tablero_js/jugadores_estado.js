// jugadores_estado.js
// Centraliza acceso a localStorage para la entidad "jugadores".
// Usamos la clave 'monopoly_jugadores' de forma consistente.

const LS_KEY = "monopoly_jugadores";

/**
 * getJugadoresLS()
 * Devuelve el array de jugadores guardado en localStorage.
 * Si no existe, devuelve [] (no intenta cargar un fallback).
 */
export function getJugadoresLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("jugadores_estado.getJugadoresLS - error leyendo LS:", e);
    return [];
  }
}

/**
 * setJugadoresLS(jugadores)
 * Guarda el array completo de jugadores en localStorage.
 */
export function setJugadoresLS(jugadores) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(jugadores));
  } catch (e) {
    console.error("jugadores_estado.setJugadoresLS - error escribiendo LS:", e);
  }
}

/**
 * findJugadorById(id)
 * Busca y devuelve el jugador con id (o undefined si no existe).
 * Nota: devuelve referencia del objeto presente en el array leido.
 */
export function findJugadorById(id) {
  const js = getJugadoresLS();
  return js.find(j => j.id === id);
}

/**
 * updateJugador(jugador)
 * Actualiza (sobrescribe) el jugador en el array y persiste.
 * Si no existe el jugador, emite una advertencia.
 */
export function updateJugador(jugador) {
  try {
    const js = getJugadoresLS();
    const idx = js.findIndex(j => j.id === jugador.id);
    if (idx >= 0) {
      js[idx] = jugador;
      setJugadoresLS(js);
    } else {
      console.warn("jugadores_estado.updateJugador: no se encontró jugador con id", jugador.id);
    }
  } catch (e) {
    console.error("jugadores_estado.updateJugador - error:", e);
  }
}

/**
 * replaceJugadores(jugadores)
 * Reemplaza completamente el array de jugadores en storage.
 */
export function replaceJugadores(jugadores) {
  setJugadoresLS(jugadores);
}

/**
 * resetJugadoresPorDefecto(defaults)
 * (Útil para pruebas) Reemplaza el storage por el array `defaults` pasado.
 * Si no se provee `defaults`, crea un jugador de ejemplo.
 */
export function resetJugadoresPorDefecto(defaults = null) {
  const base = defaults ?? [
    { id: Date.now(), nombre: "Jugador 1", pais: "", ficha: "🚗", color: "#1D1D1D", dinero: 1500, propiedades: [], posicionActual: 0, turno: true, deudaBanco: 0 }
  ];
  setJugadoresLS(base);
  return base;
}

/* EOF */
