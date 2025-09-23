let tablero = {};
let jugadores = [
  { nombre: "Manuela", turno: true },
  { nombre: "Juan", turno: false }
];
let indiceTurno = 0;

// API del profe
const API_URL = "http://127.0.0.1:5000";

async function cargarTablero() {
  const res = await fetch(`${API_URL}/board`);
  tablero = await res.json();
  construirTablero(tablero);
}

function construirTablero(data) {
  const contenedor = document.getElementById("tablero");

  // Función que solo construye la casilla visual
  function crearCasilla(casilla) {
    const div = document.createElement("div");
    div.classList.add("casilla");

    if (casilla.type === "special") {
      div.classList.add("esquina");
      if (casilla.name === "Salida") {
        div.innerHTML = `<b>Salida</b><br>💵 +${casilla.action?.money || 200}`;
      } else if (casilla.name.includes("Cárcel")) {
        div.innerHTML = `<b>Cárcel</b><br>(Solo visita)`;
      } else if (casilla.name === "Parqueo Gratis") {
        div.innerHTML = `<b>Parking</b><br>Gratis 🚗`;
      } else if (casilla.name.includes("Ve a la Cárcel")) {
        div.innerHTML = `<b>Ve a la Cárcel</b> ⛓️`;
      } else {
        div.innerHTML = `<b>${casilla.name}</b>`;
      }
      return div;
    }

    if (casilla.type === "property") {
      div.classList.add("propiedad");
      div.style.borderTop = `10px solid ${casilla.color}`;
      div.innerHTML = `
        <div class="casilla-nombre">${casilla.name}</div>
        <div class="precio">$${casilla.price}</div>
      `;
    } else if (casilla.type === "railroad") {
      div.classList.add("ferrocarril");
      div.innerHTML = `<div>🚂<br>${casilla.name}<br>$${casilla.price}</div>`;
    } else if (casilla.type === "tax") {
      div.classList.add("impuesto");
      div.innerHTML = `<div>${casilla.name}<br>💵 ${casilla.action.money}</div>`;
    } else if (casilla.type === "chance") {
      div.classList.add("carta");
      div.innerHTML = `❓<br>Suerte`;
    } else if (casilla.type === "community_chest") {
      div.classList.add("carta");
      div.innerHTML = `🎁<br>Comunidad`;
    } else {
      div.innerHTML = casilla.name || casilla.type;
    }
    return div;
  }

  // ---- Colocar esquinas manualmente ----
  contenedor.appendChild(crearCasilla(data.bottom[0])) // Salida
    .style.gridArea = "11 / 1 / 12 / 2";

  contenedor.appendChild(crearCasilla(data.left[0])) // Cárcel
    .style.gridArea = "1 / 1 / 2 / 2";

  contenedor.appendChild(crearCasilla(data.left[data.left.length-1])) // Parqueo Gratis
    .style.gridArea = "1 / 11 / 2 / 12";

  contenedor.appendChild(crearCasilla(data.top[data.top.length-1])) // Ve a la Cárcel
    .style.gridArea = "11 / 11 / 12 / 12";

  // ---- Lados ----

  // Bottom (1 al 9, sin la esquina inicial)
  data.bottom.slice(1).forEach((c, idx) => {
    contenedor.appendChild(crearCasilla(c))
      .style.gridArea = `11 / ${idx+2} / 12 / ${idx+3}`;
  });

  // Left (1 al penúltimo)
  data.left.slice(1, -1).forEach((c, idx) => {
    contenedor.appendChild(crearCasilla(c))
      .style.gridArea = `${idx+2} / 1 / ${idx+3} / 2`;
  });

  // Top (0 al penúltimo)
  data.top.slice(0, -1).forEach((c, idx) => {
    contenedor.appendChild(crearCasilla(c))
      .style.gridArea = `1 / ${11-idx} / 2 / ${12-idx}`;
  });

  // Right (todas, sin la esquina final que ya se puso)
  data.right.forEach((c, idx) => {
    contenedor.appendChild(crearCasilla(c))
      .style.gridArea = `${idx+2} / 11 / ${idx+3} / 12`;
  });
}


// Dados con animación
function tirarDados() {
  let dado1 = document.getElementById("dado1");
  let dado2 = document.getElementById("dado2");

  let interval = setInterval(() => {
    dado1.textContent = getCara();
    dado2.textContent = getCara();
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    dado1.textContent = getCara();
    dado2.textContent = getCara();
  }, 1500);
}

function getCara() {
  const caras = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  return caras[Math.floor(Math.random() * 6)];
}

// Cambiar turno
function cambiarTurno() {
  jugadores[indiceTurno].turno = false;
  indiceTurno = (indiceTurno + 1) % jugadores.length;
  jugadores[indiceTurno].turno = true;
  document.getElementById("jugador-turno").textContent = jugadores[indiceTurno].nombre;
}

// Iniciar
window.onload = async () => {
  await cargarTablero();
  document.getElementById("jugador-turno").textContent = jugadores[0].nombre;
};
