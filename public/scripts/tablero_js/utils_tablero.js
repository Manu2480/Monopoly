export function determinarCasillasVisibles() {
  const width = window.innerWidth;

  // Se lee mejor como switch(true)
  switch (true) {
    case width >= 1200:
      return 11;
    case width >= 768:
      return 7;
    default:
      return 4;
  }
}

export function calcularRangoVisible(jugadores, casillasVisibles) {
  const posicion = jugadores.find(j => j.turno)?.posicionActual ?? 0;

  const inicio = Math.floor(posicion / casillasVisibles) * casillasVisibles;
  const fin = inicio + casillasVisibles - 1;

  return { inicio, fin };
}
