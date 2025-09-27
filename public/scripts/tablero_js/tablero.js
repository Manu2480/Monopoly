import { agregarJugadorACasilla, agregarEfectosVisuales } from "./ui_tablero.js";

export function crearCasilla(casilla) {
    const div = document.createElement("div");
    div.classList.add("casilla");
    const tipo = casilla.type || "generic";
    div.setAttribute("data-tipo", tipo);

    // Mejor con switch(true) para condiciones mixtas
    switch (true) {
        case tipo === "property":
            div.classList.add("propiedad");
            if (casilla.color) div.setAttribute("data-color", casilla.color);
            break;

        case tipo === "chance":
            div.classList.add("carta-sorpresa");
            break;

        case tipo === "community_chest":
            div.classList.add("carta-comunidad");
            break;

        case casilla.name.toLowerCase().includes("cárcel"):
            div.classList.add("carcel");
            break;

        case casilla.name.toLowerCase().includes("salida"):
            div.classList.add("salida");
            break;

        case casilla.name.toLowerCase().includes("parking"):
            div.classList.add("parking");
            break;

        case tipo === "tax":
            div.classList.add("impuesto");
            break;

        case tipo === "railroad":
            div.classList.add("ferrocarril");
            break;

        default:
            // tipo genérico → no añadimos clase extra
            break;
    }

    div.innerHTML = `
      <div class="font-bold">${casilla.name}</div>
      <div class="text-xs">#${casilla.id}</div>
    `;

    return div;
}

export function renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible) {
    const tablero = document.getElementById("tablero-linear");
    if (!tablero) return;

    tablero.innerHTML = "";
    const { inicio, fin } = calcularRangoVisible(jugadores, casillasVisibles);
    const casillasAMostrar = tableroData.casillas.slice(inicio, fin + 1);

    const rangoElem = document.getElementById("rango-casillas");
    if (rangoElem) rangoElem.textContent = `${inicio}-${fin}`;

    const posicionElem = document.getElementById("posicion-actual");
    const jugadorActual = jugadores.find(j => j.turno);
    if (posicionElem) posicionElem.textContent = jugadorActual?.posicionActual ?? "0";

    for (const [index, casilla] of casillasAMostrar.entries()) {
        const elementoCasilla = crearCasilla(casilla);
        elementoCasilla.style.animationDelay = `${index * 50}ms`;
        tablero.appendChild(elementoCasilla);

        for (const jugador of jugadores) {
            if (jugador.posicionActual === casilla.id) {
                const esActual = Boolean(jugador.turno);
                agregarJugadorACasilla(elementoCasilla, jugador, esActual);
            }
        }
    }

    agregarEfectosVisuales();
}
