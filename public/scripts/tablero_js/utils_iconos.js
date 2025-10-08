// utils_iconos.js
// Mapeo de iconos de fichas a clases de Font Awesome

const ICON_MAP = {
  // Basado en los iconos de Font Awesome de inicio.html
  'sombrero': 'fa-solid fa-hat-cowboy',
  'avion': 'fa-solid fa-plane', 
  'guitarra': 'fa-solid fa-guitar',
  'barco': 'fa-solid fa-sailboat',
  'casa': 'fa-solid fa-house',
  // Agregar más iconos si es necesario
  'carro': 'fa-solid fa-car',
  'perro': 'fa-solid fa-dog',
  'gato': 'fa-solid fa-cat',
  'bicicleta': 'fa-solid fa-bicycle',
  'moto': 'fa-solid fa-motorcycle'
};

/**
 * Crea un elemento HTML con el icono de Font Awesome
 * Si no encuentra el mapeo, devuelve texto plano
 * @param {string} nombreIcono - Nombre del icono (ej: 'sombrero', 'avion')
 * @returns {string} HTML del icono o texto plano
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
 * @param {string} nombreIcono - Nombre del icono
 * @returns {string} Nombre descriptivo del icono
 */
export function getNombreIcono(nombreIcono) {
  const nombreMap = {
    'sombrero': 'Sombrero',
    'avion': 'Avión',
    'guitarra': 'Guitarra',
    'barco': 'Barco',
    'casa': 'Casa',
    'carro': 'Carro',
    'perro': 'Perro',
    'gato': 'Gato',
    'bicicleta': 'Bicicleta',
    'moto': 'Moto'
  };
  return nombreMap[nombreIcono] || nombreIcono;
}