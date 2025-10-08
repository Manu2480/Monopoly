// cartas_tablero.js

/**
 * Obtener una carta aleatoria del mazo indicado en tableroData.
 * @param {"chance"|"community_chest"} tipo
 * @param {Object} tableroData
 * @returns {Object|null} carta seleccionada o null si no hay
 */
export function obtenerCarta(tipo, tableroData) {
  if (!tableroData) return null;
  let mazo = null;
  if (tipo === "chance") mazo = tableroData.chance || [];
  else if (tipo === "community_chest") mazo = tableroData.community_chest || [];

  if (!mazo || mazo.length === 0) return null;
  const carta = mazo[Math.floor(Math.random() * mazo.length)];
  return carta || null;
}

/**
 * Muestra una carta (objeto) dentro del panel principal #panel-casilla.
 * @param {Object} carta - objeto con description, action, etc.
 */
export function voltearCartaEnPanel(carta) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  if (!carta) {
    mazo.textContent = "⬜";
    mazo.style.transform = "none";
    return;
  }

  // Animación de volteo (suave)
  mazo.style.transform = "rotateY(90deg)";
  mazo.style.transition = "transform 0.25s ease";

  setTimeout(() => {
    const texto = carta.description || carta.text || "Carta sin descripción";
    // mostramos descripción y, si existe action.money, lo indicamos
    const actionText = carta.action && typeof carta.action.money === "number"
      ? `<div style="margin-top:6px; font-weight:600;">Acción: ${carta.action.money < 0 ? 'Pagar' : 'Recibir'} $${Math.abs(carta.action.money)}</div>`
      : "";

    mazo.innerHTML = `<div style="padding:8px;">
        <div style="font-weight:700; margin-bottom:6px;">Carta</div>
        <div style="font-size:14px;">${texto}</div>
        ${actionText}
      </div>`;
    mazo.style.transform = "rotateY(0deg)";
  }, 250);

  return carta;
}

/**
 * Resetear panel (valor por defecto)
 */
export function resetPanelCarta() {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  mazo.textContent = "⬜";
  mazo.style.transform = "none";
}
