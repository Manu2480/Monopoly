// Mostrar perfil en el cuadro
export function renderizarPerfilJugador(jugador) {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (!perfilDiv) return;

  if (!jugador) {
    perfilDiv.innerHTML = ""; // limpio
    return;
  }

  let propiedadesHTML = "";
  if (jugador.propiedades && jugador.propiedades.length > 0) {
    propiedadesHTML = jugador.propiedades.map(p => {
      let detalle = `${p.nombre}`;
      if (p.hipotecada) detalle += " 🏦 (hipotecada)";
      if (p.casas && p.casas > 0) detalle += ` 🏠 x${p.casas}`;
      if (p.hoteles && p.hoteles > 0) detalle += ` 🏨 x${p.hoteles}`;
      return `<li>${detalle}</li>`;
    }).join("");
  } else {
    propiedadesHTML = "<li>Sin propiedades</li>";
  }

  const bandera = jugador.pais 
    ? `<img src="https://flagcdn.com/24x18/${jugador.pais}.png" alt="${jugador.pais}" style="vertical-align:middle; margin-left:6px;">`
    : "";

  perfilDiv.innerHTML = `
    <h2>${jugador.ficha} ${jugador.nombre}</h2>
    <ul>
      <li><strong>Color:</strong> 
        <span style="display:inline-block;width:16px;height:16px;background:${jugador.color};border-radius:50%;"></span>
      </li>
      <li><strong>País:</strong> ${jugador.pais?.toUpperCase() || "??"} ${bandera}</li>
      <li><strong>Dinero:</strong> 💰 ${jugador.dinero}</li>
      <li><strong>Deuda:</strong> ${jugador.deudaBanco > 0 ? "💸 " + jugador.deudaBanco : "✅ Sin deudas"}</li>
      <li><strong>Posición:</strong> Casilla #${jugador.posicionActual}</li>
    </ul>
    <h3>🏠 Propiedades</h3>
    <ul>${propiedadesHTML}</ul>
  `;
}

// Resetear perfil (se llama al finalizar juego)
export function resetPerfilJugador() {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (perfilDiv) {
    perfilDiv.innerHTML = ""; // vuelve a casilla vacía
  }
}
