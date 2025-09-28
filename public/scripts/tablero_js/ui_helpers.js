// ui_helpers.js
// Utilidades para la construcción de elementos de UI

/* ---------- ICONOS SVG ---------- */
export const ICONS = {
  house: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3l9 7v11a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10l9-7z"/></svg>`,
  hotel: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 21h18v-9H3v9zm2-7h14v5H5v-5zM7 9V7h10v2H7z"/></svg>`,
  mortgage: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2L2 7v13h20V7L12 2zm0 2.18L18 8v10H6V8l6-3.82zM11 11h2v6h-2z"/></svg>`,
  sell: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 6v13a2 2 0 0 0 2 2h14V6L12 2 3 6zM12 12l4-4-1.4-1.4L12 9.2 9.4 6.6 8 8l4 4z"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>`
};

/**
 * Crea un botón con texto y callback
 */
export function crearBtn(text, cb, disabled = false, disabledTitle = "") {
  const b = document.createElement("button");
  b.className = "accion-btn";
  b.type = "button";
  b.textContent = text;
  b.disabled = !!disabled;
  
  b.addEventListener("click", (e) => {
    if (b.disabled) return;
    b.disabled = true;
    try { 
      cb(e); 
    } finally { 
      // El callback actualizará UI y habilitará el botón si es necesario
    }
  });
  
  b.title = disabled ? (disabledTitle || text) : text;
  return b;
}

/**
 * Crea un botón con icono
 */
export function crearIconBtn(iconName, cb, title = "") {
  const b = document.createElement("button");
  b.className = "accion-icono";
  b.type = "button";
  b.innerHTML = ICONS[iconName] || "";
  
  b.addEventListener("click", (e) => {
    if (b.disabled) return;
    b.disabled = true;
    try { 
      cb(e); 
    } finally { 
      // El callback actualizará UI
    }
  });
  
  b.title = title || iconName;
  b.setAttribute("aria-label", title || iconName);
  return b;
}

/**
 * Crea un contenedor de acciones con estilo grid
 */
export function crearGridAcciones() {
  const grid = document.createElement("div");
  grid.className = "acciones-grid";
  grid.style.display = "flex";
  grid.style.flexDirection = "column";
  grid.style.gap = "10px";
  return grid;
}

/**
 * Crea un contenedor de iconos horizontales
 */
export function crearIconRow() {
  const iconRow = document.createElement("div");
  iconRow.className = "icon-row";
  iconRow.style.display = "flex";
  iconRow.style.gap = "8px";
  iconRow.style.marginTop = "12px";
  return iconRow;
}

/**
 * Crea un div informativo con padding estándar
 */
export function crearInfoDiv(texto, estilosExtra = {}) {
  const info = document.createElement("div");
  info.style.padding = "8px";
  info.textContent = texto;
  
  // Aplicar estilos extra
  Object.assign(info.style, estilosExtra);
  
  return info;
}

/**
 * Crea un contenedor para la cárcel con estilos específicos
 */
export function crearContainerCarcel() {
  const container = document.createElement("div");
  container.style.padding = "8px";
  container.style.border = "2px solid #ff6b6b";
  container.style.borderRadius = "8px";
  container.style.backgroundColor = "#ffebee";
  return container;
}

/**
 * Crea título para la sección de cárcel
 */
export function crearTituloCarcel(texto = "🔒 EN LA CÁRCEL") {
  const titulo = document.createElement("div");
  titulo.style.fontWeight = "bold";
  titulo.style.marginBottom = "8px";
  titulo.style.color = "#c62828";
  titulo.textContent = texto;
  return titulo;
}

/**
 * Crea div de estado con estilo específico
 */
export function crearEstadoDiv(texto) {
  const estado = document.createElement("div");
  estado.style.marginBottom = "12px";
  estado.style.fontSize = "13px";
  estado.textContent = texto;
  return estado;
}

/**
 * Crea contenedor de opciones verticales
 */
export function crearOpcionesContainer() {
  const opciones = document.createElement("div");
  opciones.style.display = "flex";
  opciones.style.flexDirection = "column";
  opciones.style.gap = "8px";
  return opciones;
}

/**
 * Limpia el contenido de un elemento DOM
 */
export function limpiarContainer(elemento) {
  if (elemento) {
    elemento.innerHTML = "";
  }
}

/**
 * Verifica si un elemento DOM existe
 */
export function elementoExiste(id) {
  return document.getElementById(id) !== null;
}

/**
 * Formatea números como moneda
 */
export function formatMoney(n) {
  return (Number(n) || 0).toLocaleString();
}