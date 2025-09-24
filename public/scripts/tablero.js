// ======================== VARIABLES GLOBALES ========================
let tableroData = {
    casillas: [],
    community_chest: [],
    chance: []
};

let jugadores = [];
let casillasVisibles = 11;
let indiceTurno = 0;

// ======================== FUNCIONES AUXILIARES ========================
function determinarCasillasVisibles() {
    const width = window.innerWidth;
    if (width >= 1024) return 11;
    if (width >= 768) return 7;
    return 4;
}

function calcularRangoVisible() {
    const jugadorActual = jugadores.find(j => j.turno);
    if (!jugadorActual) return { inicio: 0, fin: casillasVisibles - 1 };
    const posicion = jugadorActual.posicionActual;
    const inicio = Math.floor(posicion / casillasVisibles) * casillasVisibles;
    const fin = inicio + casillasVisibles - 1;
    return { inicio, fin };
}

function crearCasilla(casilla) {
    const div = document.createElement('div');
    div.classList.add('casilla');

    const tipo = casilla.type || "generic";
    div.setAttribute('data-tipo', tipo);

    if (tipo === "property") {
        div.classList.add('propiedad');
        if (casilla.color) div.setAttribute('data-color', casilla.color);
    } else if (tipo === "railroad") {
        div.classList.add('ferrocarril');
    } else if (tipo === "tax") {
        div.classList.add('impuesto');
    } else if (tipo === "chance") {
        div.classList.add('carta', 'carta-sorpresa');
        casilla.name = casilla.name || "Sorpresa ❓";
    } else if (tipo === "community_chest") {
        div.classList.add('carta', 'carta-comunidad');
        casilla.name = casilla.name || "Comunidad 🎁";
    } else if (tipo === "special") {
        div.classList.add('esquina');
    }

    div.innerHTML = `
      <div class="font-bold">${casilla.name}</div>
      <div class="text-xs">#${casilla.id}</div>
    `;

    div.addEventListener('mouseenter', mostrarInfoCasilla);
    div.addEventListener('mouseleave', ocultarInfoCasilla);

    return div;
}

function agregarJugadorACasilla(casillaElem, jugador, esActual) {
    const ficha = document.createElement('div');
    ficha.classList.add('jugador');

    // Map de colores "amigables" a hex (por si en jugadores.json hay nombres personalizados)
    const colorMap = {
      'botonblue': '#118AB2',
      'red': '#E63946',
      'green': '#06D6A0',
      'yellow': '#FFD166',
      'blue': '#118AB2',
      'black': '#1D1D1D'
    };

    ficha.style.backgroundColor = colorMap[jugador.color] || jugador.color || '#1D1D1D';
    ficha.title = jugador.nombre;
    // mostramos la ficha (emoji) si existe
    if (jugador.ficha) ficha.textContent = jugador.ficha;

    if (esActual) ficha.classList.add('ring-2');

    casillaElem.appendChild(ficha);
}


// ======================== RENDER ========================
function renderizarTablero() {
    const tablero = document.getElementById('tablero-linear');
    if (!tablero) return;

    tablero.innerHTML = '';
    const { inicio, fin } = calcularRangoVisible();
    const casillasAMostrar = tableroData.casillas.slice(inicio, fin + 1);

    const rangoElem = document.getElementById('rango-casillas');
    if (rangoElem) rangoElem.textContent = `${inicio}-${fin}`;

    const posicionElem = document.getElementById('posicion-actual');
    const jugadorActual = jugadores.find(j => j.turno);
    if (posicionElem && jugadorActual) posicionElem.textContent = jugadorActual.posicionActual;

    casillasAMostrar.forEach((casilla, index) => {
        const elementoCasilla = crearCasilla(casilla);
        elementoCasilla.style.animationDelay = `${index * 50}ms`;
        tablero.appendChild(elementoCasilla);

        jugadores.forEach(jugador => {
            if (jugador.posicionActual === casilla.id) {
                const esActual = !!jugador.turno;
                agregarJugadorACasilla(elementoCasilla, jugador, esActual);
            }
        });
    });

    agregarEfectosVisuales();
}

function ajustarResponsive() {
    if (!document.getElementById('tablero-linear')) return;
    const nuevasCasillas = determinarCasillasVisibles();
    if (nuevasCasillas !== casillasVisibles) {
        casillasVisibles = nuevasCasillas;
        renderizarTablero();
    }
}

// ======================== API ========================
async function cargarTablero() {
    try {
        const res = await fetch("http://127.0.0.1:5000/board");
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        const boardData = await res.json();

        tableroData.community_chest = boardData.community_chest || [];
        tableroData.chance = boardData.chance || [];

        const mapa = new Map();
        const secciones = ['bottom','left','top','right'];
        secciones.forEach(sec => {
            const arr = boardData[sec] || [];
            arr.forEach(item => {
                if (typeof item.id === 'number') mapa.set(item.id, item);
            });
        });

        tableroData.casillas = [];
        for (let i = 0; i < 40; i++) {
            if (!mapa.has(i)) throw new Error(`Falta casilla con id ${i} en el JSON del tablero`);
            tableroData.casillas.push(mapa.get(i));
        }
    } catch (error) {
        console.error("Error cargando tablero:", error);
        throw error;
    }
}

async function cargarJugadores() {
  try {
    const res = await fetch("json/jugadores.json");
    if (!res.ok) throw new Error("No se pudo cargar json/jugadores.json");

    jugadores = await res.json();
    indiceTurno = jugadores.findIndex(j => j.turno) || 0;

    const bannerJugador = document.getElementById("jugador-turno");
    if (bannerJugador) {
      bannerJugador.style.opacity = '0';
      setTimeout(() => {
        bannerJugador.textContent = jugadores[indiceTurno].nombre;
        bannerJugador.style.opacity = '1';
      }, 300);
    }
  } catch (error) {
    console.error("Error cargando jugadores:", error);
  }
}

// ======================= EFECTOS VISUALES =======================
function agregarEfectosVisuales() {
  const casillas = document.querySelectorAll('.casilla');
  casillas.forEach((casilla, index) => {
    casilla.style.opacity = '0';
    casilla.style.transform = 'scale(0.95)';
    setTimeout(() => {
      casilla.style.transition = 'all 0.5s ease';
      casilla.style.opacity = '1';
      casilla.style.transform = 'scale(1)';
    }, index * 40);
  });
}

function mostrarInfoCasilla(event) {
  const casilla = event.currentTarget;
  const tipo = casilla.getAttribute('data-tipo');
  if (tipo === 'property' || tipo === 'railroad') {
    casilla.style.transform = 'scale(1.05)';
    casilla.style.zIndex = '100';
  }
}

function ocultarInfoCasilla(event) {
  const casilla = event.currentTarget;
  casilla.style.transform = 'scale(1)';
  casilla.style.zIndex = '1';
}

// ======================= CARTAS =======================
function voltearCarta(tipo) {
  let mazo = document.getElementById("mazo-" + tipo);
  let cartas = tipo === "suerte" ? tableroData.chance : tableroData.community_chest;

  if (!cartas || cartas.length === 0) return;

  mazo.style.transform = 'rotateY(90deg)';
  mazo.style.transition = 'transform 0.3s ease';

  setTimeout(() => {
    let carta = cartas[Math.floor(Math.random() * cartas.length)];
    mazo.textContent = carta.description || carta.text || "";
    mazo.classList.add("carta-volteada");
    mazo.style.transform = 'rotateY(0deg)';

    mazo.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
    mazo.style.padding = '10px';
    mazo.style.fontSize = '14px';
    mazo.style.textAlign = 'center';
    mazo.style.wordWrap = 'break-word';
    setTimeout(() => {
      mazo.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
    }, 1000);
  }, 300);
}

// ======================= DADOS =======================
function tirarDados() {
  let dado1 = document.getElementById("dado1");
  let dado2 = document.getElementById("dado2");

  dado1.classList.add('animando');
  dado2.classList.add('animando');

  let contador = 0;
  let interval = setInterval(() => {
    dado1.textContent = getCara();
    dado2.textContent = getCara();
    contador++;
    if (contador > 10) {
      clearInterval(interval);
      interval = setInterval(() => {
        dado1.textContent = getCara();
        dado2.textContent = getCara();
      }, 200);
    }
  }, 100);

  setTimeout(() => {
    clearInterval(interval);

    const resultado1 = getCara();
    const resultado2 = getCara();
    dado1.textContent = resultado1;
    dado2.textContent = resultado2;

    dado1.classList.remove('animando');
    dado2.classList.remove('animando');

    dado1.style.transform = 'scale(1.2)';
    dado2.style.transform = 'scale(1.2)';
    setTimeout(() => {
      dado1.style.transform = 'scale(1)';
      dado2.style.transform = 'scale(1)';
    }, 300);

    const suma = obtenerValorDado(resultado1) + obtenerValorDado(resultado2);
    mostrarResultadoDados(suma);

    if (jugadores.length > 0) moverJugador(jugadores[indiceTurno].id, suma);
  }, 1500);
}

function getCara() {
  const caras = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  return caras[Math.floor(Math.random() * 6)];
}

function obtenerValorDado(cara) {
  const valores = {"⚀":1,"⚁":2,"⚂":3,"⚃":4,"⚄":5,"⚅":6};
  return valores[cara] || 1;
}

function mostrarResultadoDados(suma) {
  const resultado = document.createElement('div');
  resultado.textContent = `Total: ${suma}`;
  resultado.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
    transition: all 0.3s ease;
  `;
  document.querySelector('.contenedor-dados').appendChild(resultado);
  setTimeout(() => {
    resultado.style.opacity = '1';
    resultado.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
  setTimeout(() => {
    resultado.style.opacity = '0';
    resultado.style.transform = 'translate(-50%, -50%) scale(0.5)';
    setTimeout(() => resultado.remove(), 300);
  }, 2000);
}

// ======================= CAMBIAR TURNO =======================
function cambiarTurno() {
  jugadores[indiceTurno].turno = false;
  indiceTurno = (indiceTurno + 1) % jugadores.length;
  jugadores[indiceTurno].turno = true;

  const banner = document.getElementById("jugador-turno");
  banner.style.transform = 'scale(0.9)';
  banner.style.opacity = '0.7';

  setTimeout(() => {
    banner.textContent = jugadores[indiceTurno].nombre;
    banner.style.transform = 'scale(1)';
    banner.style.opacity = '1';
  }, 300);

  resetearCartas();
  renderizarTablero(); // actualizar inmediatamente la línea de casillas
}

function resetearCartas() {
  const mazoSuerte = document.getElementById("mazo-suerte");
  const mazoComunidad = document.getElementById("mazo-comunidad");
  [mazoSuerte, mazoComunidad].forEach(mazo => {
    if (mazo && mazo.classList.contains('carta-volteada')) {
      mazo.style.transform = 'rotateY(90deg)';
      setTimeout(() => {
        mazo.classList.remove("carta-volteada");
        mazo.style.transform = 'rotateY(0deg)';
        mazo.textContent = mazo.id.includes('suerte') ? "❓" : "🎁";
      }, 300);
    }
  });
}

// ======================== LÓGICA DE JUEGO ========================
function moverJugador(idJugador, pasos) {
    const jugador = jugadores.find(j => j.id === idJugador);
    if (!jugador) return;
    jugador.posicionActual = (jugador.posicionActual + pasos) % 40;
    renderizarTablero();
}

// ======================== INIT ========================
window.onload = async () => {
    const originalBodyHTML = document.body.innerHTML;
    try {
        await cargarTablero();
        await cargarJugadores();
        setTimeout(() => {
            document.body.innerHTML = originalBodyHTML;
            casillasVisibles = determinarCasillasVisibles();
            renderizarTablero();
            window.addEventListener('resize', ajustarResponsive);
        }, 1000);
    } catch (err) {
        console.error("❌ Error iniciando el juego:", err);
    }
};

// ======================== DEBUG ========================
window.debug_moverA = (pos) => {
    const jugador = jugadores.find(j => j.turno);
    if (jugador) {
        jugador.posicionActual = pos % 40;
        renderizarTablero();
    }
};
