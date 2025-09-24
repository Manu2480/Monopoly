export function determinarCasillasVisibles() {
    const width = window.innerWidth;
    if (width >= 1200) return 11;
    if (width >= 768) return 7;
    return 4;
}

export function calcularRangoVisible(jugadores, casillasVisibles) {
    const jugadorActual = jugadores.find(j => j.turno);
    if (!jugadorActual) return { inicio: 0, fin: casillasVisibles - 1 };
    const posicion = jugadorActual.posicionActual;
    const inicio = Math.floor(posicion / casillasVisibles) * casillasVisibles;
    const fin = inicio + casillasVisibles - 1;
    return { inicio, fin };
}
