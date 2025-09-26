import { voltearCarta } from "./cartas_tablero.js";

export function agregarJugadorACasilla(casillaElem, jugador, esActual) {
  let contenedor = casillaElem.querySelector(".jugadores-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.classList.add("jugadores-container");
    casillaElem.appendChild(contenedor);
  }

  const ficha = document.createElement("div");
  ficha.classList.add("jugador");
  ficha.style.backgroundColor = jugador.color || "#1D1D1D";
  ficha.title = jugador.nombre;
  if (jugador.ficha) ficha.textContent = jugador.ficha;

  if (esActual) ficha.classList.add("ring-2");
  contenedor.appendChild(ficha);
}

export function renderizarBarraJugadores(jugadores) {
  const barra = document.getElementById("lista-jugadores");
  if (!barra) return;
  barra.innerHTML = "";

  for (const j of jugadores) {
    const span = document.createElement("span");
    span.textContent = `${j.ficha || ""} ${j.nombre}`;
    span.classList.add("jugador-barra");
    span.style.color = j.color;

    // Clases activo/inactivo
    if (j.turno) {
      span.classList.add("activo");
      span.classList.remove("inactivo");
    } else {
      span.classList.remove("activo");
      span.classList.add("inactivo");
    }

    barra.appendChild(span);
  }
}

export function mostrarPanelCasilla(casilla, jugador, tableroData) {
  const panel = document.getElementById("panel-casilla");
  const acciones = document.getElementById("acciones-casilla");
  if (!panel || !acciones) return;

  acciones.innerHTML = "";
  if (!casilla) {
    panel.textContent = "⬜";
    return;
  }

  // Cambio de if/else if por switch
  switch (casilla.type) {
    case "property":
    case "railroad": {
      panel.textContent = `🏠 ${casilla.name}`;
      const btn = document.createElement("button");
      btn.textContent = "Comprar";
      btn.onclick = () => alert(`${jugador.nombre} compró ${casilla.name}`);
      acciones.appendChild(btn);
      break;
    }

    case "chance":
    case "community_chest": {
      panel.textContent = casilla.type === "chance" ? "❓ Suerte" : "🎁 Comunidad";
      const btn = document.createElement("button");
      btn.textContent = "Voltear carta";
      btn.onclick = () => voltearCarta(casilla.type, tableroData);
      acciones.appendChild(btn);
      break;
    }

    default:
      panel.textContent = `ℹ️ ${casilla.name}`;
      break;
  }
}

export function mostrarResultadoDados(suma) {
  const resultado = document.createElement("div");
  resultado.textContent = `Total: ${suma}`;
  resultado.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
  `;
  const contDados = document.querySelector(".contenedor-dados");
  if (contDados) contDados.appendChild(resultado);
  setTimeout(() => resultado.remove(), 2000);
}

export function agregarEfectosVisuales() {
  const casillas = document.querySelectorAll(".casilla");

  let i = 0;
  for (const casilla of casillas) {
    casilla.style.opacity = "0";
    casilla.style.transform = "scale(0.95)";
    setTimeout(() => {
      casilla.style.transition = "all 0.5s ease";
      casilla.style.opacity = "1";
      casilla.style.transform = "scale(1)";
    }, i * 40);
    i++;
  }
}
