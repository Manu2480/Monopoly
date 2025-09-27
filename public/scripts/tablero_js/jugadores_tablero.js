import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores, mostrarPanelCasilla } from "./ui_tablero.js";

export function moverJugador(idJugador, pasos, jugadores, tableroData, casillasVisibles, calcularRangoVisible) {
  const jugador = jugadores.find(j => j.id === idJugador);
  if (!jugador) return;

  const totalCasillas = tableroData.casillas.length || 40;
  const posicionActual = jugador.posicionActual ?? 0;

  jugador.posicionActual = (posicionActual + pasos) % totalCasillas;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  mostrarPanelCasilla(tableroData.casillas[jugador.posicionActual], jugador, tableroData);
}

export function cambiarTurno(jugadores, indiceTurno, setIndiceTurno, setPuedeTirar, setHaMovido) {
  // Desactivar turno actual
  jugadores[indiceTurno].turno = false;

  // Calcular nuevo turno
  const nuevoTurno = (indiceTurno + 1) % jugadores.length;
  jugadores[nuevoTurno].turno = true;

  // Actualizar estado externo
  setIndiceTurno(nuevoTurno);
  setPuedeTirar(true);
  setHaMovido(false);

  return jugadores[nuevoTurno];
}

//ver el perfil del jugador actual
export function verPerfil(jugadores, indiceTurno) {
  const jugador = jugadores[indiceTurno];
  if (!jugador) {
    alert("No hay jugador en turno.");
    return;
  }

  const perfilDiv = document.getElementById("perfil-jugador");
  const btnPerfil = document.getElementById("btn-perfil");

  // 👉 Si el perfil ya está visible, ciérralo
  if (perfilDiv.style.display === "block") {
    perfilDiv.classList.add("oculto");
    setTimeout(() => {
      perfilDiv.style.display = "none";
      perfilDiv.classList.remove("oculto");
      btnPerfil.textContent = "👤 Ver Perfil";
    }, 300);
    return;
  }

  // 👉 Si estaba cerrado, abrirlo
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

  const bandera = `<img src="https://flagcdn.com/24x18/${jugador.pais}.png" 
                     alt="${jugador.pais}" 
                     style="vertical-align:middle; margin-left:6px;">`;

  perfilDiv.innerHTML = `
    <h2>👤 Perfil de ${jugador.nombre}</h2>
    <ul>
      <li><strong>Ficha:</strong> ${jugador.ficha}</li>
      <li><strong>Color:</strong> 
        <span style="display:inline-block;width:20px;height:20px;background:${jugador.color};border-radius:50%;"></span>
      </li>
      <li><strong>País:</strong> ${jugador.pais.toUpperCase()} ${bandera}</li>
      <li><strong>Dinero:</strong> 💰 ${jugador.dinero}</li>
      <li><strong>Deuda con banco:</strong> ${jugador.deudaBanco > 0 ? "💸 " + jugador.deudaBanco : "✅ Sin deudas"}</li>
      <li><strong>Posición actual:</strong> Casilla #${jugador.posicionActual}</li>
    </ul>
    <h3>🏠 Propiedades</h3>
    <ul>${propiedadesHTML}</ul>
  `;

  perfilDiv.style.display = "block";
  perfilDiv.classList.remove("oculto");

  // 👉 Cambiar texto del botón
  btnPerfil.textContent = "❌ Cerrar Perfil";
}


