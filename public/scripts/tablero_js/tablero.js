import { agregarJugadorACasilla, agregarEfectosVisuales } from "./ui_tablero.js";

export function crearCasilla(casilla) {
    const div = document.createElement('div');
    div.classList.add('casilla');

    const tipo = casilla.type || "generic";
    div.setAttribute('data-tipo', tipo);

    if (tipo === "property") {
        div.classList.add('propiedad');
        if (casilla.color) div.setAttribute('data-color', casilla.color);
    } else if (tipo === "chance") div.classList.add('carta-sorpresa');
    else if (tipo === "community_chest") div.classList.add('carta-comunidad');
    else if (casilla.name.toLowerCase().includes("cárcel")) div.classList.add('carcel');
    else if (casilla.name.toLowerCase().includes("salida")) div.classList.add('salida');
    else if (casilla.name.toLowerCase().includes("parking")) div.classList.add('parking');
    else if (tipo === "tax") div.classList.add('impuesto');
    else if (tipo === "railroad") div.classList.add('ferrocarril');

    div.innerHTML = `
      <div class="font-bold">${casilla.name}</div>
      <div class="text-xs">#${casilla.id}</div>
    `;

    return div;
}

export function renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible) {
    const tablero = document.getElementById('tablero-linear');
    if (!tablero) return;

    tablero.innerHTML = '';
    const { inicio, fin } = calcularRangoVisible(jugadores, casillasVisibles);
    const casillasAMostrar = tableroData.casillas.slice(inicio, fin + 1);

    const rangoElem = document.getElementById('rango-casillas');
    if (rangoElem) rangoElem.textContent = `${inicio}-${fin}`;

    const posicionElem = document.getElementById('posicion-actual');
    const jugadorActual = jugadores.find(j => j.turno);
    if (posicionElem) posicionElem.textContent = jugadorActual ? jugadorActual.posicionActual : "0";

    casillasAMostrar.forEach((casilla, index) => {
        const elementoCasilla = crearCasilla(casilla);
        elementoCasilla.style.animationDelay = `${index * 50}ms`;
        tablero.appendChild(elementoCasilla);

        jugadores.forEach(jugador => {
            if (jugador.posicionActual === casilla.id) {
                const esActual = !!jugador.turno;
                agregarJugadorACasilla(elementoCasilla, jugador, esActual);
            }
        });
    });

    agregarEfectosVisuales();
}
