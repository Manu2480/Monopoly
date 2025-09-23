// public/scripts/tablero.js - Versión integrada con API del profesor
document.addEventListener("DOMContentLoaded", () => {
  // Configuración de la API del profesor
  const API_BASE = "http://127.0.0.1:5000";
  const ENDPOINTS = {
    board: `${API_BASE}/board`,
    countries: `${API_BASE}/countries`,
    ranking: `${API_BASE}/ranking`,
    scoreRecorder: `${API_BASE}/score-recorder`
  };

  // Construir grid 11x11 del tablero
  const tablero = document.getElementById("tablero");
  if (tablero) {
    let html = "";
    for (let fila = 0; fila < 11; fila++) {
      for (let columna = 0; columna < 11; columna++) {
        const indice = fila * 11 + columna;
        html += `<div id="casilla-${indice}" class="casilla" data-fila="${fila}" data-columna="${columna}" data-posicion-monopoly="-1"></div>`;
      }
    }
    tablero.innerHTML = html;
  }

  // Elementos de la UI
  const btnTirar = document.getElementById("btn-tirar");
  const mostrarDados = document.getElementById("mostrar-dados");
  const listaJugadoresUL = document.getElementById("lista-jugadores-ul");
  const jugadorActualDiv = document.getElementById("jugador-actual");
  const registroDiv = document.getElementById("registro");
  const apiStatusDiv = document.getElementById("api-status");

  // Estado del juego
  let jugadores = [];
  let orden = [];
  let indiceTurno = 0;
  let posiciones = {};
  let tableroData = null;
  let paisesData = null;
  let propiedadesJugadores = {}; // Para rastrear propiedades de cada jugador
  const TOTAL_CASILLAS = 40;

  // Función para hacer peticiones seguras a la API
  async function peticionSegura(url, opciones = {}) {
    try {
      console.log(`Haciendo petición a: ${url}`);
      const respuesta = await fetch(url, opciones);
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
      console.log(`Respuesta exitosa de ${url}:`, datos);
      
      // Actualizar status de API
      if (apiStatusDiv) {
        apiStatusDiv.textContent = "🟢 API Conectada";
        apiStatusDiv.className = "api-status conectado";
      }
      
      return datos;
    } catch (error) {
      console.error("Error en peticionSegura:", error);
      agregarRegistro("⚠️ " + error.message);
      
      // Actualizar status de API
      if (apiStatusDiv) {
        apiStatusDiv.textContent = "🔴 API Desconectada";
        apiStatusDiv.className = "api-status desconectado";
      }
      
      return null;
    }
  }

  // Agregar mensaje al registro de actividades
  function agregarRegistro(texto) {
    if (!registroDiv) return;
    const elemento = document.createElement("div");
    elemento.textContent = `[${new Date().toLocaleTimeString()}] ${texto}`;
    registroDiv.prepend(elemento);
  }

  // Cargar datos del tablero desde la API
  async function cargarTablero() {
    const datos = await peticionSegura(ENDPOINTS.board);
    if (datos) {
      tableroData = datos;
      agregarRegistro("Tablero cargado desde la API");
      aplicarDatosTablero();
      actualizarInfoTablero();
    }
    return datos;
  }

  // Cargar países desde la API
  async function cargarPaises() {
    const datos = await peticionSegura(ENDPOINTS.countries);
    if (datos) {
      paisesData = datos;
      agregarRegistro("Países cargados desde la API");
      actualizarInfoPaises();
    }
    return datos;
  }

  // Aplicar los datos del tablero a las casillas del DOM
  function aplicarDatosTablero() {
    if (!tableroData) return;
    
    // Limpiar casillas existentes
    document.querySelectorAll('.casilla').forEach(casilla => {
      casilla.classList.remove('esquina', 'propiedad', 'especial', 'impuesto', 'ferrocarril', 'carta');
      casilla.innerHTML = '';
      casilla.style.backgroundColor = '';
    });

    // Obtener todas las casillas del tablero en orden correcto
    const todasLasCasillas = [
      ...tableroData.bottom,
      ...tableroData.left.slice(1), // Omitir la primera porque es la esquina que ya está en bottom
      ...tableroData.top.reverse(),
      ...tableroData.right.slice(1).reverse() // Omitir la primera porque es la esquina que ya está en top
    ];

    // Aplicar datos a cada casilla
    todasLasCasillas.forEach((casilla, posicionMonopoly) => {
      const idCasillaDOM = mapearPosicionACasillaId(posicionMonopoly);
      const elemento = document.getElementById(idCasillaDOM);
      if (!elemento) return;

      // Guardar la posición del Monopoly en el elemento
      elemento.dataset.posicionMonopoly = posicionMonopoly;
      elemento.dataset.casillaId = casilla.id;
      
      // Aplicar nombre y título
      elemento.innerHTML = `<span class="casilla-nombre">${casilla.name}</span>`;
      elemento.title = `${casilla.name} (ID: ${casilla.id})`;

      // Aplicar estilos según el tipo
      switch (casilla.type) {
        case 'special':
          elemento.classList.add('esquina', 'especial');
          if (casilla.name.includes('Salida')) {
            elemento.style.backgroundColor = '#10b981';
            elemento.style.color = 'white';
          } else if (casilla.name.includes('Cárcel')) {
            elemento.style.backgroundColor = '#f59e0b';
          } else if (casilla.name.includes('Parqueo')) {
            elemento.style.backgroundColor = '#ef4444';
            elemento.style.color = 'white';
          } else if (casilla.name.includes('Ve a la Cárcel')) {
            elemento.style.backgroundColor = '#dc2626';
            elemento.style.color = 'white';
          }
          break;

        case 'property':
          elemento.classList.add('propiedad');
          elemento.style.borderTop = `8px solid ${obtenerColorPropiedad(casilla.color)}`;
          elemento.innerHTML += `<div class="precio">$${casilla.price}</div>`;
          break;

        case 'railroad':
          elemento.classList.add('ferrocarril');
          elemento.style.backgroundColor = '#374151';
          elemento.style.color = 'white';
          elemento.innerHTML += `<div class="precio">$${casilla.price}</div>`;
          break;

        case 'tax':
          elemento.classList.add('impuesto');
          elemento.style.backgroundColor = '#fbbf24';
          elemento.innerHTML += `<div class="impuesto-valor">$${Math.abs(casilla.action.money)}</div>`;
          break;

        case 'community_chest':
          elemento.classList.add('carta');
          elemento.style.backgroundColor = '#8b5cf6';
          elemento.style.color = 'white';
          break;

        case 'chance':
          elemento.classList.add('carta');
          elemento.style.backgroundColor = '#f97316';
          elemento.style.color = 'white';
          break;
      }
    });

    agregarRegistro("Tablero configurado con datos de la API");
  }

  // Obtener color CSS de una propiedad según su color del Monopoly
  function obtenerColorPropiedad(color) {
    const colores = {
      'brown': '#8b4513',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'orange': '#f97316',
      'red': '#ef4444',
      'yellow': '#fbbf24',
      'green': '#10b981',
      'blue': '#3b82f6'
    };
    return colores[color] || '#6b7280';
  }

  // Cargar jugadores (desde localStorage, variable global o crear ejemplos)
  async function cargarJugadores() {
    // Intentar cargar jugadores de localStorage (datos del compañero)
    const jugadoresGuardados = localStorage.getItem('jugadores');
    if (jugadoresGuardados) {
      try {
        jugadores = JSON.parse(jugadoresGuardados);
        agregarRegistro(`Cargados ${jugadores.length} jugadores desde localStorage`);
      } catch (e) {
        console.error("Error al parsear jugadores:", e);
        jugadores = [];
      }
    }

    // Si no hay jugadores, intentar cargar desde una variable global (por si el compañero la usa)
    if (jugadores.length === 0 && window.jugadoresCreados) {
      jugadores = window.jugadoresCreados;
      agregarRegistro(`Cargados ${jugadores.length} jugadores desde variable global`);
    }

    // Si aún no hay jugadores, crear algunos de ejemplo
    if (jugadores.length === 0) {
      jugadores = [
        {
          "id": Date.now(),
          "nombre": "Jugador 1",
          "pais": "Colombia", 
          "ficha": "🚗",
          "color": "botonblue",
          "dinero": 1500
        },
        {
          "id": Date.now() + 1,
          "nombre": "Jugador 2",
          "pais": "Spain (España)",
          "ficha": "🐘",
          "color": "botonyellow", 
          "dinero": 1500
        }
      ];
      agregarRegistro("No se encontraron jugadores, usando datos de ejemplo");
    }

    // Ordenar por ID y configurar estado inicial
    jugadores.sort((a, b) => a.id - b.id);
    orden = jugadores.map(jugador => jugador.id);
    jugadores.forEach(jugador => {
      if (posiciones[jugador.id] === undefined) posiciones[jugador.id] = 0;
      if (propiedadesJugadores[jugador.id] === undefined) propiedadesJugadores[jugador.id] = [];
    });

    renderizarJugadores();
    renderizarFichasTablero();
    actualizarUIJugadorActual();
    actualizarContadorJugadores();
  }

  // Función para recargar jugadores manualmente
  window.cargarJugadoresManual = async function() {
    // Limpiar datos actuales
    jugadores = [];
    posiciones = {};
    propiedadesJugadores = {};
    
    // Recargar
    await cargarJugadores();
    agregarRegistro("Jugadores recargados manualmente");
  };

  // Cargar ranking desde la API
  async function cargarRanking() {
    const datos = await peticionSegura(ENDPOINTS.ranking);
    if (datos) {
      agregarRegistro("Ranking cargado desde la API");
      console.log("Ranking actual:", datos);
      actualizarInfoRanking(datos);
    }
    return datos;
  }

  // Enviar puntaje a la API
  async function enviarPuntaje(jugador, puntaje) {
    const datos = {
      nick_name: jugador.nombre,
      score: puntaje,
      country_code: obtenerCodigoPais(jugador.pais)
    };

    const resultado = await peticionSegura(ENDPOINTS.scoreRecorder, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos)
    });

    if (resultado) {
      agregarRegistro(`Puntaje enviado: ${jugador.nombre} - ${puntaje} puntos`);
    }
    return resultado;
  }

  // Obtener código de país (mapeo básico)
  function obtenerCodigoPais(pais) {
    const mapeo = {
      'Colombia': 'co',
      'Spain (España)': 'es',
      'España': 'es',
      'Estados Unidos': 'us',
      'México': 'mx',
      'Argentina': 'ar',
      'Chile': 'cl',
      'Perú': 'pe'
    };
    return mapeo[pais] || 'co';
  }

  // Renderizar lista de jugadores en el DOM
  function renderizarJugadores() {
    if (!listaJugadoresUL) return;
    listaJugadoresUL.innerHTML = "";
    jugadores.forEach(jugador => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between p-3 bg-gray-50 rounded-lg border";
      
      const paisTexto = jugador.pais || "Sin país";
      const codigoPais = obtenerCodigoPais(paisTexto);
      const numPropiedades = propiedadesJugadores[jugador.id] ? propiedadesJugadores[jugador.id].length : 0;
      
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="ficha-mini" style="background:${colorDeClase(jugador.color || '')}">${jugador.ficha || '●'}</div>
          <div class="text-sm">
            <div class="font-medium">${jugador.nombre}</div>
            <div class="text-xs text-slate-500">💰 $${jugador.dinero ?? 1500} | 🏠 ${numPropiedades} props | 🌍 ${paisTexto} (${codigoPais.toUpperCase()})</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500 mb-1">Pos: ${posiciones[jugador.id] ?? 0}</div>
          <button onclick="enviarPuntajeJugador(${jugador.id})" class="text-xs bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded">
            📊 Enviar Puntaje
          </button>
        </div>
      `;
      listaJugadoresUL.appendChild(li);
    });
  }

  // Renderizar fichas de jugadores en el tablero
  function renderizarFichasTablero() {
    // Limpiar fichas anteriores
    document.querySelectorAll('.ficha').forEach(f => f.remove());
    document.querySelectorAll('.nombre-ficha').forEach(f => f.remove());

    jugadores.forEach((jugador, indice) => {
      const posicion = posiciones[jugador.id] ?? 0;
      const idCasilla = mapearPosicionACasillaId(posicion);
      const casilla = document.getElementById(idCasilla);
      if (!casilla) return;

      const ficha = document.createElement("div");
      ficha.className = "ficha";
      ficha.dataset.jugador = jugador.id;
      ficha.style.background = colorDeClase(jugador.color || "");
      ficha.style.color = esColorOscuro(jugador.color) ? "white" : "black";
      ficha.textContent = jugador.ficha ?? "●";

      // Desplazamiento para múltiples fichas en la misma casilla
      const desplazamiento = 10 * (indice % 4);
      ficha.style.transform = `translate(${desplazamiento}px, ${desplazamiento}px)`;

      const nombre = document.createElement("div");
      nombre.className = "nombre-ficha";
      nombre.textContent = jugador.nombre;

      casilla.appendChild(ficha);
      casilla.appendChild(nombre);
    });
  }

  // Mapear posición del monopoly (0-39) a ID de casilla del DOM
  function mapearPosicionACasillaId(posicion) {
    const perimetro = [];
    // Bottom row (right to left)
    for (let columna = 10; columna >= 0; columna--) perimetro.push(10 * 11 + columna);
    // Left column (bottom to top, excluding corners)
    for (let fila = 9; fila >= 1; fila--) perimetro.push(fila * 11 + 0);
    // Top row (left to right, excluding corners)
    for (let columna = 1; columna <= 10; columna++) perimetro.push(0 * 11 + columna);
    // Right column (top to bottom, excluding corners)
    for (let fila = 1; fila <= 9; fila++) perimetro.push(fila * 11 + 10);
    
    const indice = posicion % perimetro.length;
    const indiceCasilla = perimetro[indice];
    return `casilla-${indiceCasilla}`;
  }

  // Obtener color CSS a partir del nombre de clase del jugador
  function colorDeClase(clase) {
    if (!clase) return "#efefef";
    if (clase.includes("blue") || clase.includes("azul")) return "#2563eb";
    if (clase.includes("red") || clase.includes("rojo")) return "#ef4444";
    if (clase.includes("green") || clase.includes("verde")) return "#10b981";
    if (clase.includes("yellow") || clase.includes("amarillo")) return "#f59e0b";
    if (clase.includes("black") || clase.includes("negro")) return "#111827";
    return "#7c3aed";
  }

  // Verificar si un color es oscuro para ajustar el texto
  function esColorOscuro(clase) {
    return clase && (clase.includes("black") || clase.includes("negro") || clase.includes("blue") || clase.includes("azul"));
  }

  // Actualizar UI del jugador actual
  function actualizarUIJugadorActual() {
    if (!jugadorActualDiv) return;
    if (orden.length === 0) {
      jugadorActualDiv.textContent = "Jugador: —";
      return;
    }
    const idActual = orden[indiceTurno % orden.length];
    const jugador = jugadores.find(j => j.id === idActual) || {};
    jugadorActualDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full" style="background:${colorDeClase(jugador.color)}"></div>
        <span>Turno: ${jugador.nombre ?? "—"}</span>
      </div>
    `;
    
    // Actualizar turno en header si existe
    const turnoActualSpan = document.getElementById("turno-actual");
    if (turnoActualSpan) {
      turnoActualSpan.textContent = `Turno: ${jugador.nombre ?? "—"}`;
    }
  }

  // Actualizar contador de jugadores en header
  function actualizarContadorJugadores() {
    const totalJugadoresSpan = document.getElementById("total-jugadores");
    if (totalJugadoresSpan) {
      totalJugadoresSpan.textContent = `Jugadores: ${jugadores.length}`;
    }
  }

  // Manejar tirada de dados
  async function manejarTirarDados() {
    if (orden.length === 0) { agregarRegistro("No hay jugadores."); return; }
    const idActual = orden[indiceTurno % orden.length];
    const jugador = jugadores.find(j => j.id === idActual);
    if (!jugador) return;

    // Deshabilitar botón temporalmente
    if (btnTirar) btnTirar.disabled = true;

    const dado1 = 1 + Math.floor(Math.random() * 6);
    const dado2 = 1 + Math.floor(Math.random() * 6);
    const total = dado1 + dado2;
    if (mostrarDados) mostrarDados.textContent = `${dado1} + ${dado2} = ${total}`;

    agregarRegistro(`🎲 ${jugador.nombre} tiró ${dado1} y ${dado2} (avanza ${total})`);

    const posicionAnterior = posiciones[idActual] ?? 0;
    const nuevaPosicion = (posicionAnterior + total) % TOTAL_CASILLAS;
    posiciones[idActual] = nuevaPosicion;

    // Verificar si pasó por la Salida
    if (nuevaPosicion < posicionAnterior || (posicionAnterior + total >= TOTAL_CASILLAS)) {
      jugador.dinero += 200;
      agregarRegistro(`💰 ${jugador.nombre} pasó por la Salida y recibió $200`);
      
      // Enviar puntaje por pasar por la Salida
      await enviarPuntaje(jugador, 20); // 20 puntos por pasar por la salida
    }

    // Procesar la casilla en la que cayó
    await procesarCasilla(jugador, nuevaPosicion);

    renderizarFichasTablero();
    renderizarJugadores();

    // Cambiar turno solo si no sacó doble
    if (dado1 !== dado2) {
      indiceTurno = (indiceTurno + 1) % orden.length;
      actualizarUIJugadorActual();
    } else {
      agregarRegistro(`🎯 ${jugador.nombre} sacó doble y juega otra vez!`);
    }

    // Rehabilitar botón
    if (btnTirar) {
      setTimeout(() => {
        btnTirar.disabled = false;
      }, 1000);
    }
  }

  // Procesar acciones de la casilla donde cayó el jugador
  async function procesarCasilla(jugador, posicion) {
    if (!tableroData) return;

    // Obtener todas las casillas del tablero en orden
    const todasLasCasillas = [
      ...tableroData.bottom,
      ...tableroData.left.slice(1),
      ...tableroData.top.reverse(),
      ...tableroData.right.slice(1).reverse()
    ];

    const casilla = todasLasCasillas[posicion];
    if (!casilla) return;

    agregarRegistro(`📍 ${jugador.nombre} cayó en: ${casilla.name}`);

    switch (casilla.type) {
      case 'property':
      case 'railroad':
        await procesarPropiedad(jugador, casilla);
        break;
        
      case 'tax':
        if (casilla.action && casilla.action.money) {
          jugador.dinero += casilla.action.money;
          agregarRegistro(`💸 ${jugador.nombre} ${casilla.action.money < 0 ? 'pagó' : 'recibió'} $${Math.abs(casilla.action.money)}`);
          
          // Enviar puntaje (negativo si es impuesto)
          await enviarPuntaje(jugador, Math.floor(casilla.action.money / 10));
        }
        break;

      case 'community_chest':
        await procesarCarta(jugador, tableroData.community_chest, 'Caja de Comunidad');
        break;

      case 'chance':
        await procesarCarta(jugador, tableroData.chance, 'Sorpresa');
        break;

      case 'special':
        if (casilla.action) {
          if (casilla.action.money) {
            jugador.dinero += casilla.action.money;
            agregarRegistro(`🎁 ${jugador.nombre} recibió $${casilla.action.money} en ${casilla.name}`);
            await enviarPuntaje(jugador, Math.floor(casilla.action.money / 10));
          }
          if (casilla.action.goTo === 'jail') {
            posiciones[jugador.id] = 10; // Posición de la cárcel
            agregarRegistro(`🚨 ${jugador.nombre} va a la cárcel!`);
          }
        }
        break;
    }
  }

  // Procesar propiedades y ferrocarriles
  async function procesarPropiedad(jugador, casilla) {
    const propietario = encontrarPropietario(casilla.id);
    
    if (!propietario) {
      // Propiedad disponible para comprar
      if (jugador.dinero >= casilla.price) {
        const comprar = confirm(`🏠 ${jugador.nombre}, ¿quieres comprar ${casilla.name} por $${casilla.price}?`);
        if (comprar) {
          jugador.dinero -= casilla.price;
          propiedadesJugadores[jugador.id].push(casilla.id);
          agregarRegistro(`🏡 ${jugador.nombre} compró ${casilla.name} por $${casilla.price}`);
          
          // Enviar puntaje por compra
          await enviarPuntaje(jugador, Math.floor(casilla.price / 20));
        }
      } else {
        agregarRegistro(`💸 ${jugador.nombre} no tiene suficiente dinero para comprar ${casilla.name}`);
      }
    } else if (propietario.id !== jugador.id) {
      // Pagar renta al propietario
      let renta = casilla.rent ? casilla.rent.base || casilla.rent[1] : 50;
      
      if (jugador.dinero >= renta) {
        jugador.dinero -= renta;
        propietario.dinero += renta;
        agregarRegistro(`💰 ${jugador.nombre} pagó $${renta} de renta a ${propietario.nombre}`);
        
        // Enviar puntajes
        await enviarPuntaje(jugador, -Math.floor(renta / 10));
        await enviarPuntaje(propietario, Math.floor(renta / 10));
      } else {
        agregarRegistro(`💸 ${jugador.nombre} no tiene dinero suficiente para pagar la renta!`);
      }
    } else {
      agregarRegistro(`🏠 ${jugador.nombre} está en su propia propiedad: ${casilla.name}`);
    }
  }

  // Procesar cartas de Sorpresa o Caja de Comunidad
  async function procesarCarta(jugador, cartas, tipo) {
    if (!cartas || cartas.length === 0) return;
    
    const carta = cartas[Math.floor(Math.random() * cartas.length)];
    agregarRegistro(`🃏 ${jugador.nombre} sacó carta de ${tipo}: ${carta.description}`);
    
    if (carta.action && carta.action.money) {
      jugador.dinero += carta.action.money;
      await enviarPuntaje(jugador, Math.floor(carta.action.money / 10));
    }
  }

  // Encontrar propietario de una propiedad
  function encontrarPropietario(propiedadId) {
    for (let jugadorId in propiedadesJugadores) {
      if (propiedadesJugadores[jugadorId].includes(propiedadId)) {
        return jugadores.find(j => j.id == jugadorId);
      }
    }
    return null;
  }

  // Terminar turno manualmente
  function terminarTurno() {
    if (orden.length === 0) return;
    indiceTurno = (indiceTurno + 1) % orden.length;
    actualizarUIJugadorActual();
    agregarRegistro(`⏭️ Turno cambiado`);
  }

  // Función global para enviar puntaje (para usar desde HTML)
  window.enviarPuntajeJugador = async function(jugadorId) {
    const jugador = jugadores.find(j => j.id == jugadorId);
    if (jugador) {
      // Calcular puntaje basado en dinero y propiedades
      let puntaje = Math.floor(jugador.dinero / 10);
      puntaje += propiedadesJugadores[jugador.id].length * 50;
      
      await enviarPuntaje(jugador, puntaje);
    }
  };

  // Actualizar información de panels
  function actualizarInfoTablero() {
    const infoTablero = document.getElementById("info-tablero");
    if (infoTablero && tableroData) {
      const totalProps = tableroData.bottom.length + tableroData.left.length + tableroData.top.length + tableroData.right.length;
      const totalCards = (tableroData.community_chest?.length || 0) + (tableroData.chance?.length || 0);
      infoTablero.innerHTML = `
        📋 ${totalProps} casillas<br>
        🃏 ${totalCards} cartas<br>
        ✅ Cargado
      `;
    }
  }

  function actualizarInfoPaises() {
    const infoPaises = document.getElementById("info-paises");
    if (infoPaises && paisesData) {
      const totalPaises = Array.isArray(paisesData) ? paisesData.length : Object.keys(paisesData).length;
      infoPaises.innerHTML = `
        🌍 ${totalPaises} países<br>
        ✅ Cargado
      `;
    }
  }

  function actualizarInfoRanking(ranking) {
    const infoRanking = document.getElementById("info-ranking");
    if (infoRanking) {
      if (ranking && ranking.length > 0) {
        const top3 = ranking.slice(0, 3);
        let html = "";
        top3.forEach((player, index) => {
          const medalla = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
          html += `${medalla} ${player.nick_name}<br>`;
        });
        infoRanking.innerHTML = html;
      } else {
        infoRanking.innerHTML = "Sin datos aún";
      }
    }
  }

  // Inicialización de la aplicación
  async function inicializar() {
    agregarRegistro("🚀 Iniciando aplicación del tablero...");
    
    // Cargar datos de la API en paralelo
    const promesasAPI = [
      cargarTablero(),
      cargarPaises(),
      cargarRanking()
    ];
    
    await Promise.allSettled(promesasAPI);
    
    // Cargar jugadores después de tener los datos de la API
    await cargarJugadores();
    
    agregarRegistro("✅ ¡Tablero listo para jugar!");
  }

  // Event listeners para botones
  if (btnTirar) btnTirar.addEventListener("click", manejarTirarDados);
  const btnTerminar = document.getElementById("btn-terminar-turno");
  if (btnTerminar) btnTerminar.addEventListener("click", terminarTurno);

  // Agregar botón para mostrar ranking
  const controles = document.querySelector('.controles');
  if (controles) {
    const btnRanking = document.createElement('button');
    btnRanking.textContent = '🏆 Ver Ranking';
    btnRanking.className = 'px-4 py-2 bg-yellow-600 text-white rounded shadow hover:bg-yellow-700';
    btnRanking.addEventListener('click', mostrarRanking);
    controles.appendChild(btnRanking);
  }

  // Función para mostrar ranking en modal/alert
  async function mostrarRanking() {
    const ranking = await cargarRanking();
    if (ranking && ranking.length > 0) {
      let mensaje = "🏆 RANKING ACTUAL:\n\n";
      ranking.forEach((jugador, index) => {
        const medalla = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
        mensaje += `${medalla} ${jugador.nick_name} - ${jugador.score} pts (${jugador.country_code.toUpperCase()})\n`;
      });
      alert(mensaje);
    } else {
      alert("No hay datos de ranking disponibles.");
    }
  }

  // Iniciar aplicación
  inicializar();

  // API de debug para usar desde la consola del navegador
  window._monopoly = {
    // Estado del juego
    jugadores, 
    posiciones, 
    orden, 
    propiedadesJugadores, 
    tableroData,
    
    // Funciones útiles
    establecerPos: (id, posicion) => { 
      posiciones[id] = posicion; 
      renderizarFichasTablero(); 
      renderizarJugadores(); 
      agregarRegistro(`Debug: Jugador ${id} movido a posición ${posicion}`);
    },
    
    mostrarEstado: () => {
      console.log("=== ESTADO ACTUAL DEL JUEGO ===");
      console.log("Jugadores:", jugadores);
      console.log("Posiciones:", posiciones);
      console.log("Propiedades por jugador:", propiedadesJugadores);
      console.log("Orden de turnos:", orden);
      console.log("Índice de turno actual:", indiceTurno);
      console.log("Jugador actual:", orden[indiceTurno] ? jugadores.find(j => j.id === orden[indiceTurno]) : null);
      console.log("Datos del tablero cargados:", !!tableroData);
      console.log("Datos de países cargados:", !!paisesData);
    },
    
    simularCompra: (jugadorId, propiedadId) => {
      if (!propiedadesJugadores[jugadorId]) propiedadesJugadores[jugadorId] = [];
      propiedadesJugadores[jugadorId].push(propiedadId);
      renderizarJugadores();
      agregarRegistro(`Debug: Simulada compra de propiedad ${propiedadId} por jugador ${jugadorId}`);
      console.log(`Simulada compra de propiedad ${propiedadId} por jugador ${jugadorId}`);
    },
    
    darDinero: (jugadorId, cantidad) => {
      const jugador = jugadores.find(j => j.id == jugadorId);
      if (jugador) {
        jugador.dinero += cantidad;
        renderizarJugadores();
        agregarRegistro(`Debug: ${cantidad > 0 ? 'Agregados' : 'Quitados'} ${Math.abs(cantidad)} a ${jugador.nombre}`);
      }
    },
    
    cambiarTurno: () => {
      terminarTurno();
    },
    
    reiniciarJuego: () => {
      jugadores.forEach(jugador => {
        posiciones[jugador.id] = 0;
        jugador.dinero = 1500;
        propiedadesJugadores[jugador.id] = [];
      });
      indiceTurno = 0;
      renderizarJugadores();
      renderizarFichasTablero();
      actualizarUIJugadorActual();
      agregarRegistro("Debug: Juego reiniciado");
    },
    
    // APIs para testing
    testAPI: async () => {
      console.log("=== TESTING API ENDPOINTS ===");
      
      console.log("Testing /board...");
      const board = await peticionSegura(ENDPOINTS.board);
      console.log("Board response:", board ? "✅ OK" : "❌ ERROR");
      
      console.log("Testing /countries...");
      const countries = await peticionSegura(ENDPOINTS.countries);
      console.log("Countries response:", countries ? "✅ OK" : "❌ ERROR");
      
      console.log("Testing /ranking...");
      const ranking = await peticionSegura(ENDPOINTS.ranking);
      console.log("Ranking response:", ranking ? "✅ OK" : "❌ ERROR");
      
      console.log("Testing /score-recorder...");
      if (jugadores.length > 0) {
        const testScore = await enviarPuntaje(jugadores[0], 100);
        console.log("Score recorder response:", testScore ? "✅ OK" : "❌ ERROR");
      }
    },
    
    // Información de ayuda
    ayuda: () => {
      console.log(`
=== MONOPOLY DEBUG TOOLS ===

Funciones disponibles:
• _monopoly.mostrarEstado() - Ver estado actual del juego
• _monopoly.establecerPos(jugadorId, posicion) - Mover jugador
• _monopoly.simularCompra(jugadorId, propiedadId) - Simular compra
• _monopoly.darDinero(jugadorId, cantidad) - Modificar dinero
• _monopoly.cambiarTurno() - Cambiar turno manualmente
• _monopoly.reiniciarJuego() - Reiniciar partida
• _monopoly.testAPI() - Probar conexión con API
• _monopoly.ayuda() - Mostrar esta ayuda

Propiedades:
• _monopoly.jugadores - Array de jugadores
• _monopoly.posiciones - Posiciones actuales
• _monopoly.propiedadesJugadores - Propiedades de cada jugador
• _monopoly.tableroData - Datos del tablero de la API

Ejemplo de uso:
_monopoly.establecerPos(${jugadores[0]?.id || 'JUGADOR_ID'}, 15)
_monopoly.simularCompra(${jugadores[0]?.id || 'JUGADOR_ID'}, 1)
_monopoly.darDinero(${jugadores[0]?.id || 'JUGADOR_ID'}, 500)
      `);
    }
  };

  // Mostrar ayuda inicial en consola
  console.log("🎲 Monopoly cargado correctamente!");
  console.log("Usa _monopoly.ayuda() para ver las herramientas de debug disponibles");
  console.log("API configurada en:", API_BASE);
});

// Funciones globales adicionales para compatibilidad
window.reiniciarTablero = function() {
  location.reload();
};

// Función para exportar estado del juego (útil para debugging)
window.exportarEstado = function() {
  const estado = {
    jugadores: window._monopoly?.jugadores || [],
    posiciones: window._monopoly?.posiciones || {},
    propiedades: window._monopoly?.propiedadesJugadores || {},
    orden: window._monopoly?.orden || [],
    turno: window._monopoly ? window._monopoly.orden[window._monopoly.indiceTurno] : null,
    timestamp: new Date().toISOString()
  };
  
  console.log("Estado exportado:", estado);
  
  // Opcional: guardar en localStorage para persistencia
  localStorage.setItem('monopoly_estado_backup', JSON.stringify(estado));
  
  return estado;
};

// Función para importar estado del juego
window.importarEstado = function(estado) {
  if (!estado || !window._monopoly) {
    console.error("Estado inválido o juego no inicializado");
    return false;
  }
  
  try {
    // Restaurar estado
    window._monopoly.jugadores.splice(0);
    window._monopoly.jugadores.push(...estado.jugadores);
    
    Object.assign(window._monopoly.posiciones, estado.posiciones);
    Object.assign(window._monopoly.propiedadesJugadores, estado.propiedades);
    
    window._monopoly.orden = estado.orden;
    
    // Re-renderizar
    window._monopoly.renderizarJugadores();
    window._monopoly.renderizarFichasTablero();
    window._monopoly.actualizarUIJugadorActual();
    
    console.log("Estado importado correctamente");
    return true;
  } catch (error) {
    console.error("Error al importar estado:", error);
    return false;
  }
};