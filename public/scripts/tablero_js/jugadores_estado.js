// jugadores_estado.js
const LS_KEY = "monopoly_jugadores"; // <- igual que api_tablero.cargarJugadores

export function getJugadoresLS() {
  return JSON.parse(localStorage.getItem(LS_KEY)) || [];
}

export function setJugadoresLS(jugadores) {
  localStorage.setItem(LS_KEY, JSON.stringify(jugadores));
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
  } else {
    // si no existe, lo añadimos al final para evitar pérdida de datos
    js.push(jugador);
    setJugadoresLS(js);
  }
}

export function replaceJugadores(jugadores) {
  setJugadoresLS(jugadores);
}

