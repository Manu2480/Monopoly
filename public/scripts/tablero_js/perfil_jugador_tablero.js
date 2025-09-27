// perfil_jugador_tablero.js
// Mostrar perfil en el cuadro
// Firma compatible: renderizarPerfilJugador(jugador, tableroData=null, actualizarUI=null)
export function renderizarPerfilJugador(jugador, tableroData = null, actualizarUI = null) {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (!perfilDiv) return;

  if (!jugador) {
    perfilDiv.innerHTML = ""; // limpio
    return;
  }

  let propiedadesHTML = "";
  if (jugador.propiedades && jugador.propiedades.length > 0) {
    propiedadesHTML = jugador.propiedades.map(p => {
      // Si en tu objeto propiedad tienes 'nombre', úsalo; si no, mostramos idPropiedad
      const nombre = p.nombre || (p.idPropiedad ? `Propiedad #${p.idPropiedad}` : "Propiedad");
      let detalle = `${nombre}`;
      if (p.hipotecada || p.hipotecado) detalle += " 🏦 (hipotecada)";
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
    <h2>${jugador.ficha || ""} ${jugador.nombre || "Jugador"}</h2>
    <ul>
      <li><strong>Color:</strong> 
        <span style="display:inline-block;width:16px;height:16px;background:${jugador.color || "#999"};border-radius:50%;"></span>
      </li>
      <li><strong>País:</strong> ${jugador.pais?.toUpperCase() || "??"} ${bandera}</li>
      <li><strong>Dinero:</strong> 💰 ${jugador.dinero ?? 0}</li>
      <li><strong>Posición:</strong> Casilla #${jugador.posicionActual ?? 0}</li>
    </ul>
    <h3>🏠 Propiedades</h3>
    <ul>${propiedadesHTML}</ul>
  `;

  // Si te interesa más adelante añadir botones en perfil que llamen a acciones (vender/hipotecar),
  // ahora `actualizarUI` está disponible para pasar al handler.
}

// Resetear perfil (se llama al finalizar juego)
export function resetPerfilJugador() {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (perfilDiv) {
    perfilDiv.innerHTML = ""; // vuelve a casilla vacía
  }
}
