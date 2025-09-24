let jugadores = [];
let indiceTurno = 0;
let tablero = {};
let cartasSuerte = [];
let cartasComunidad = [];

// =======================
//   Cargar jugadores
// =======================
async function cargarJugadores() {
  const res = await fetch("json/jugadores.json");
  jugadores = await res.json();
  indiceTurno = jugadores.findIndex(j => j.turno) || 0;
  document.getElementById("jugador-turno").textContent = jugadores[indiceTurno].nombre;
}

// =======================
//   Cargar tablero
// =======================
async function cargarTablero() {
  try {
    const res = await fetch("http://127.0.0.1:5000/board");
    tablero = await res.json();

    // Guardar cartas desde el JSON
    cartasSuerte = tablero.chance;
    cartasComunidad = tablero.community_chest;

    construirTablero(tablero);
  } catch (err) {
    console.error("Error cargando tablero:", err);
  }
}



function construirTablero(data) {
  const contenedor = document.querySelector(".parent");

  function crearCasilla(casilla) {
    const div = document.createElement("div");
    div.classList.add("casilla");

    if (casilla.type === "special") {
      div.classList.add("esquina");
      if (casilla.name.includes("Salida")) {
        div.innerHTML = `<b>Salida</b><br>💵 +${casilla.action?.money || 200}`;
      } else if (casilla.name.includes("Cárcel")) {
        div.innerHTML = `<b>Cárcel</b><br>(Solo visita)`;
      } else if (casilla.name.includes("Parqueo")) {
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
    }
    return div;
  }

  // Esquinas
  contenedor.appendChild(crearCasilla(data.bottom[0])).style.gridArea = "11 / 1 / 12 / 2";
  contenedor.appendChild(crearCasilla(data.left[0])).style.gridArea = "1 / 1 / 2 / 2";
  contenedor.appendChild(crearCasilla(data.left[data.left.length - 1])).style.gridArea = "1 / 11 / 2 / 12";
  contenedor.appendChild(crearCasilla(data.top[data.top.length - 1])).style.gridArea = "11 / 11 / 12 / 12";

  // Lados
  data.bottom.slice(1).forEach((c, idx) =>
    contenedor.appendChild(crearCasilla(c)).style.gridArea = `11 / ${idx + 2} / 12 / ${idx + 3}`
  );
  data.left.slice(1, -1).forEach((c, idx) =>
    contenedor.appendChild(crearCasilla(c)).style.gridArea = `${idx + 2} / 1 / ${idx + 3} / 2`
  );
  data.top.slice(0, -1).forEach((c, idx) =>
    contenedor.appendChild(crearCasilla(c)).style.gridArea = `1 / ${11 - idx} / 2 / ${12 - idx}`
  );
  data.right.forEach((c, idx) =>
    contenedor.appendChild(crearCasilla(c)).style.gridArea = `${idx + 2} / 11 / ${idx + 3} / 12`
  );
}

// =======================
//   Cartas
// =======================
function voltearCarta(tipo) {
  let mazo = document.getElementById("mazo-" + tipo);
  let cartas = tipo === "suerte" ? cartasSuerte : cartasComunidad;
  let carta = cartas[Math.floor(Math.random() * cartas.length)];
  mazo.textContent = carta.description;
  mazo.classList.add("carta-volteada");
}

// =======================
//   Dados
// =======================
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

// =======================
//   Cambiar turno
// =======================
function cambiarTurno() {
  jugadores[indiceTurno].turno = false;
  indiceTurno = (indiceTurno + 1) % jugadores.length;
  jugadores[indiceTurno].turno = true;
  document.getElementById("jugador-turno").textContent = jugadores[indiceTurno].nombre;
  document.getElementById("mazo-suerte").textContent = "❓";
  document.getElementById("mazo-comunidad").textContent = "🎁";
  document.getElementById("mazo-suerte").classList.remove("carta-volteada");
  document.getElementById("mazo-comunidad").classList.remove("carta-volteada");
}

// =======================
//   Iniciar
// =======================
window.onload = async () => {
  await cargarJugadores();
  await cargarTablero();
};
