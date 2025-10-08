import { agregarJugadorACasilla, agregarEfectosVisuales } from "./ui_tablero.js";

export function crearCasilla(casilla) {
  const div = document.createElement("div");
  div.classList.add("casilla");
  const tipo = casilla.type || "generic";
  div.setAttribute("data-tipo", tipo);

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
    case casilla.name && casilla.name.toLowerCase().includes("cárcel"):
      div.classList.add("carcel");
      break;
    case casilla.name && casilla.name.toLowerCase().includes("salida"):
      div.classList.add("salida");
      break;
    case casilla.name && casilla.name.toLowerCase().includes("parking"):
      div.classList.add("parking");
      break;
    case tipo === "tax":
      div.classList.add("impuesto");
      break;
    case tipo === "railroad":
      div.classList.add("ferrocarril");
      break;
    default:
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

    // ---- aplicar color de fondo según propietario ----
    // encontrar propietario que tenga esta propiedad
    const propietario = jugadores.find(j => (j.propiedades || []).some(p => p.idPropiedad === casilla.id));
    if (propietario) {
      // encontrar el objeto propiedad para chequear hipoteca
      const propObj = (propietario.propiedades || []).find(p => p.idPropiedad === casilla.id);
      if (propObj && propObj.hipotecado) {
        elementoCasilla.style.background = "#dcdcdc"; // gris cuando hipotecada
        elementoCasilla.style.opacity = "0.9";
      } else {
        // color más suave para no romper la franja superior
        elementoCasilla.style.background = `linear-gradient(180deg, ${propietario.color}20, ${propietario.color}05)`; 
        // el valor `${propietario.color}20` asume color en hex; puede ajustarse según tu esquema.
      }
    } else {
      // propiedad sin dueño -> fondo blanco (default)
      elementoCasilla.style.background = ""; // deja CSS por defecto (white)
    }

    // Insertar los jugadores dentro de la casilla (fichas)
    for (const jugador of jugadores) {
      if (jugador.posicionActual === casilla.id) {
        const esActual = Boolean(jugador.turno);
        agregarJugadorACasilla(elementoCasilla, jugador, esActual);
      }
    }
  }

  agregarEfectosVisuales();
}
