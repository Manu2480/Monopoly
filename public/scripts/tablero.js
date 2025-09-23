let tablero = {};
let jugadores = [];
let indiceTurno = 0;

// URL de la API del profe
const API_URL = "http://127.0.0.1:5000";

// Inicializar tablero desde la API del profe
async function cargarTablero() {
  try {
    const res = await fetch(`${API_URL}/board`);
    tablero = await res.json();
    construirTablero(tablero);
    agregarRegistro("✅ Tablero cargado desde la API del profe");
  } catch (err) {
    console.error("Error cargando tablero:", err);
    agregarRegistro("❌ Error cargando el tablero desde la API");
  }
}

// Construir tablero en el DOM
function construirTablero(data) {
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";

  const lados = ["bottom", "left", "top", "right"];

  lados.forEach(lado => {
    data[lado].forEach(casilla => {
      const div = document.createElement("div");
      div.classList.add("casilla");
      div.dataset.posicionMonopoly = casilla.id;

      if (casilla.type === "property") {
        div.classList.add("propiedad");
        div.style.borderTopColor = casilla.color;
      } else if (casilla.type === "railroad") {
        div.classList.add("ferrocarril");
      } else if (casilla.type === "tax") {
        div.classList.add("impuesto");
      } else if (casilla.type === "chance" || casilla.type === "community_chest") {
        div.classList.add("carta");
      } else if (casilla.type === "special") {
        div.classList.add("esquina");
      }

      div.innerHTML = `
        <div class="casilla-nombre">${casilla.name}</div>
        ${casilla.price ? `<div class="precio">$${casilla.price}</div>` : ""}
        ${casilla.action && casilla.action.money ? `<div class="impuesto-valor">${casilla.action.money}</div>` : ""}
      `;

      contenedor.appendChild(div);
    });
  });
}

// Inicializar jugadores desde el JSON local
async function cargarJugadores() {
  try {
    const res = await fetch("json/jugadores.json"); // creado en la vista de inicio
    jugadores = await res.json();

    // Si nadie tiene turno, asignar al primero
    if (!jugadores.some(j => j.turno === true)) {
      jugadores.forEach((j, i) => j.turno = (i === 0));
    }

    agregarRegistro("✅ Jugadores cargados desde jugadores.json");
    actualizarUIJugadores();
  } catch (err) {
    console.error("Error cargando jugadores.json:", err);
    agregarRegistro("❌ No se pudo cargar jugadores.json");
  }
}

// UI de lista de jugadores
function actualizarUIJugadores() {
  const lista = document.getElementById("jugadoresLista");
  lista.innerHTML = "";
  jugadores.forEach((j) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${j.ficha} ${j.nombre} (${j.pais})</span> 
      - 💵 ${j.dinero} 
      - ${j.turno ? "👉 En turno" : ""}
    `;
    li.style.color = j.turno ? "green" : "black";
    lista.appendChild(li);
  });
}

// Dados
function lanzarDados() {
  const dado1 = Math.ceil(Math.random() * 6);
  const dado2 = Math.ceil(Math.random() * 6);
  const total = dado1 + dado2;
  agregarRegistro(`🎲 Se lanzaron los dados: ${dado1} y ${dado2} → Total: ${total}`);
}

// Cambiar turno
function terminarTurno() {
  if (jugadores.length === 0) return;

  let actual = jugadores.findIndex(j => j.turno === true);

  if (actual >= 0) jugadores[actual].turno = false;

  let siguiente = (actual + 1) % jugadores.length;
  jugadores[siguiente].turno = true;

  actualizarUIJugadores();
  agregarRegistro(`⏭️ Turno cambiado → ahora juega ${jugadores[siguiente].nombre}`);
}

// Registro
function agregarRegistro(mensaje) {
  const registro = document.getElementById("registro");
  const div = document.createElement("div");
  div.textContent = mensaje;
  registro.appendChild(div);
  registro.scrollTop = registro.scrollHeight;
}

// Iniciar
window.onload = async () => {
  await cargarTablero();   // API del profe
  await cargarJugadores(); // JSON creado por ustedes
};
