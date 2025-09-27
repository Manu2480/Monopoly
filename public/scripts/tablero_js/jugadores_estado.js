
// Usar una única clave consistente para todo el proyecto:
const LS_KEY = "monopoly_jugadores";

export function getJugadoresLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch (e) {
    console.error("Error parseando jugadores en LS:", e);
    return [];
  }
}

export function setJugadoresLS(jugadores) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(jugadores));
  } catch (e) {
    console.error("Error guardando jugadores en LS:", e);
  }
}

export function findJugadorById(id) {
  const js = getJugadoresLS();
  return js.find(j => j.id === id);
}

export function updateJugador(jugador) {
  const js = getJugadoresLS();
  const idx = js.findIndex(j => j.id === jugador.id);
  if (idx >= 0) {
    js[idx] = jugador;
    setJugadoresLS(js);
    return true;
  } else {
    console.warn("updateJugador: jugador no encontrado", jugador.id);
    return false;
  }
}

export function replaceJugadores(jugadores) {
  setJugadoresLS(jugadores);
}
