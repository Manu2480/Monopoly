export function voltearCarta(tipo, tableroData) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;

  let cartas;
  switch (tipo) {
    case "chance": // cartas de suerte
      cartas = tableroData.chance;
      break;
    case "community_chest": // cartas de comunidad
      cartas = tableroData.community_chest;
      break;
    default:
      mazo.textContent = `Tipo de carta desconocido: ${tipo}`;
      return;
  }

  if (!cartas || cartas.length === 0) {
    mazo.textContent = `No hay cartas de ${tipo}`;
    return;
  }

  // Animación de volteo
  mazo.style.transform = "rotateY(90deg)";
  mazo.style.transition = "transform 0.3s ease";

  setTimeout(() => {
    const carta = cartas[Math.floor(Math.random() * cartas.length)];
    const texto = carta.description || carta.text || "Carta sin descripción";
    mazo.innerHTML = `<div class="texto">${texto}</div>`;
    mazo.style.transform = "rotateY(0deg)";
  }, 300);
}

export function resetPanelCarta() {
  const mazo = document.getElementById("panel-casilla");
  if (mazo) {
    mazo.textContent = "⬜"; // valor por defecto
    mazo.style.transform = "none";
  }
}

