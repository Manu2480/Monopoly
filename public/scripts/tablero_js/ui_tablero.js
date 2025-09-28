// ui_tablero.js
// Ahora delegamos el render de acciones a ui_acciones.mostrarAccionesCasillaDOM
import { renderPanelCasilla, mostrarAccionesCasillaDOM } from "./ui_acciones.js";
import { crearIconoFicha, getNombreIcono } from "./utils_iconos.js";

/**
 * Añade la ficha visual del jugador dentro de la casilla DOM
 */
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
  
  // Para el title usamos el nombre descriptivo
  ficha.title = `${jugador.nombre} (${getNombreIcono(jugador.ficha)})`;
  
  // 🔧 FIX: Usar iconos de Font Awesome
  if (jugador.ficha) {
    const iconoHtml = crearIconoFicha(jugador.ficha);
    ficha.innerHTML = iconoHtml;
  }

  if (esActual) ficha.classList.add("ring-2");
  contenedor.appendChild(ficha);
}

/**
 * Renderiza la barra lateral de jugadores
 */
export function renderizarBarraJugadores(jugadores) {
  const barra = document.getElementById("lista-jugadores");
  if (!barra) return;
  barra.innerHTML = "";

  for (const j of jugadores) {
    const span = document.createElement("span");
    
    // 🔧 FIX: Usar iconos de Font Awesome
    const iconoHtml = crearIconoFicha(j.ficha || "");
    span.innerHTML = `${iconoHtml} ${j.nombre}`;
    
    span.classList.add("jugador-barra");
    span.style.color = j.color;

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

/**
 * mostrarPanelCasilla
 * - Ahora delega por completo la creación de botones a mostrarAccionesCasillaDOM.
 *
 * Firma nueva (compatible hacia atrás):
 * mostrarPanelCasilla(casilla, jugador, jugadores = [jugador], tableroData = {}, callbacks = {})
 *
 * callbacks (opcional): { actualizarUI, bloquearPasarTurno, habilitarPasarTurno }
 */
export function mostrarPanelCasilla(casilla, jugador, jugadores = null, tableroData = {}, callbacks = {}) {
  const panel = document.getElementById("panel-casilla");
  const acciones = document.getElementById("acciones-casilla");
  if (!panel || !acciones) return;

  // Limpiar acciones (las vamos a volver a delegar)
  acciones.innerHTML = "";

  // Render de la tarjeta informativa en el panel
  if (!casilla) {
    panel.textContent = "⬜";
  } else {
    // reutilizamos renderPanelCasilla de ui_acciones para mostrar la info
    renderPanelCasilla(casilla);
  }

  // Normalizar jugadores: si no recibieron array, usamos sólo el jugador actual para evitar fallos
  const jugadoresArr = Array.isArray(jugadores) ? jugadores : (jugador ? [jugador] : []);

  // Delegar la construcción de los botones/acciones al módulo ui_acciones
  // mostrarAccionesCasillaDOM rellenará #acciones-casilla con los botones pertinentes
  mostrarAccionesCasillaDOM(
    jugador || (jugadoresArr.length ? jugadoresArr[0] : null),
    casilla,
    jugadoresArr,
    tableroData || {},
    callbacks
  );
}

/**
 * Mostrar el popup con el resultado de los dados
 */
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

/**
 * Pequeña animación al renderizar casillas
 */
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
