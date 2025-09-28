
// 1. Crear un archivo utils_iconos.js o agregar esto al inicio de ui_tablero.js

const ICON_MAP = {
  // Basado en los iconos de Font Awesome de inicio.html
  'sombrero': 'fa-solid fa-hat-cowboy',
  'avion': 'fa-solid fa-plane', 
  'guitarra': 'fa-solid fa-guitar',
  'barco': 'fa-solid fa-sailboat',
  'casa': 'fa-solid fa-house'
};

/**
 * Crea un elemento HTML con el icono de Font Awesome
 * Si no encuentra el mapeo, devuelve texto plano
 */
export function crearIconoFicha(nombreIcono) {
  const claseIcono = ICON_MAP[nombreIcono];
  if (claseIcono) {
    return `<i class="${claseIcono}"></i>`;
  }
  return nombreIcono; // fallback
}

/**
 * Para títulos y atributos donde no se puede usar HTML, devuelve el nombre descriptivo
 */
export function getNombreIcono(nombreIcono) {
  const nombreMap = {
    'sombrero': 'Sombrero',
    'avion': 'Avión',
    'guitarra': 'Guitarra',
    'barco': 'Barco',
    'casa': 'Casa'
  };
  return nombreMap[nombreIcono] || nombreIcono;
}