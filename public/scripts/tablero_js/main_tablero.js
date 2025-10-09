// ======================== IMPORTS ========================
import { cargarTablero, cargarJugadores } from "./api_tablero.js";
import { renderizarTablero } from "./tablero.js";
import { renderizarBarraJugadores } from "./ui_tablero.js";
import { tirarDados } from "./dados_tablero.js";

import { cambiarTurno, moverJugador } from "./jugadores_tablero.js";
import { determinarCasillasVisibles, calcularRangoVisible } from "./utils_tablero.js";
import { resetPanelCarta } from "./cartas_tablero.js";

import { mostrarAccionesCasillaDOM, tienePendientes} from "./ui_acciones.js";
import { renderizarPerfilJugador, resetPerfilJugador } from "./perfil_jugador_tablero.js";

import {resetMazoState} from "./control_casillas.js";
import { tramoConMayorPromedio, resetEstadisticas } from "./estadisticas_renta.js";

// ======================== VARIABLES GLOBALES ========================
let tableroData = { casillas: [], community_chest: [], chance: [] };
let jugadores = [];
let indiceTurno = 0;
let puedeTirar = true;
let haMovido = false;
let casillasVisibles = 11;
let juegoIniciado = false;

// ======================== FUNCIONES AUXILIARES ========================
function setEstadoBotones(estado) {
  const btnInicio = document.getElementById("btn-inicio");
  const botones = [
    document.getElementById("btn-dados"),
    document.getElementById("btn-mover"),
    document.getElementById("btn-turno"),
  ];

  switch (estado) {
    case "no-iniciado":
      btnInicio.disabled = false;
      btnInicio.textContent = "▶️ Iniciar Juego";
      botones.forEach(b => (b.disabled = true));
      break;

    case "jugando":
      btnInicio.disabled = false;
      btnInicio.textContent = "⏹️ Finalizar Juego";
      botones.forEach(b => (b.disabled = false));
      break;

    case "finalizado":
      btnInicio.disabled = false;
      btnInicio.textContent = "▶️ Iniciar Juego";
      botones.forEach(b => (b.disabled = true));
      break;
  }
}

function iniciarJuego() {
  indiceTurno = 0;
  jugadores.forEach(j => {
    j.turno = false;
    j.accionResuelta = false; // ✅ resetear al inicio
  });
  if (jugadores[indiceTurno]) jugadores[indiceTurno].turno = true;

  juegoIniciado = true;
  puedeTirar = true;
  haMovido = false;

  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  setEstadoBotones("jugando");

  mostrarAccionesCasillaParaJugadorActual();
}

// Función modificada para redirigir a fin.html
function finalizarJuego() {
  // Guardar snapshot final de jugadores para fin.html
  try {
    // Calcular patrimonio final para cada jugador antes de guardar
    jugadores.forEach(j => {
      let valorPropiedades = 0;
      let terrenos = 0, ferrocarriles = 0, servicios = 0;
      let casas = 0, hoteles = 0;

      (j.propiedades || []).forEach(p => {
        const propInfo = Array.isArray(tableroData.casillas) ? tableroData.casillas.find(b => b.id == p.idPropiedad) : null;
        const basePrice = propInfo ? (propInfo.price || 0) : 0;

        if (propInfo && propInfo.type === "property") terrenos++;
        if (propInfo && propInfo.type === "railroad") ferrocarriles++;
        if (propInfo && propInfo.type === "utility") servicios++;

        // Solo contar valor si no está hipotecado
        if (!p.hipotecado) {
          valorPropiedades += basePrice;
          valorPropiedades += (p.casas || 0) * 100;
          valorPropiedades += (p.hotel || 0) * 200;
        }

        casas += p.casas || 0;
        hoteles += p.hotel || 0;
      });

      // Actualizar propiedades calculadas
      j.valorPropiedades = valorPropiedades;
      j.terrenos = terrenos;
      j.ferrocarriles = ferrocarriles;
      j.servicios = servicios;
      j.casas = casas;
      j.hoteles = hoteles;
      j.patrimonio = (j.dinero || 0) + valorPropiedades - (j.deudaBanco || 0);
    });

    // Guardar en localStorage para que fin.html lo lea
    localStorage.setItem("jugadores_partida", JSON.stringify(jugadores));
    
    console.log("[main_tablero.js] Datos finales guardados para fin.html");
  } catch (e) {
    console.error("[main_tablero.js] Error guardando datos finales:", e);
  }

   // Antes de redirigir, calcular tramo con mayor promedio
  try {
    const totalCasillas = Array.isArray(tableroData.casillas) ? tableroData.casillas.length : 0;
    const mejorTramo = tramoConMayorPromedio(totalCasillas, casillasVisibles);
    if (mejorTramo) {
      // Guardar también el mejor tramo para mostrarlo en fin.html
      localStorage.setItem("mejor_tramo_promedio", JSON.stringify(mejorTramo));
      console.log("[main_tablero.js] Mejor tramo promedio registrado:", mejorTramo);
    } else {
      localStorage.removeItem("mejor_tramo_promedio");
      console.log("[main_tablero.js] No hubo pagos de renta registrados en la partida.");
    }

    // Reset opcional de estadísticas (si quieres que se reinicie al finalizar)
    // resetEstadisticas();
  } catch (e) {
    console.error("[main_tablero.js] Error calculando mejor tramo:", e);
  }

  // Limpiar estado del juego
  jugadores.forEach(j => (j.turno = false));
  juegoIniciado = false;

  // Redirigir a fin.html
  window.location.href = "fin.html";
}

// ======================== ACCIONES CASILLA ACTUAL ========================
function bloquearPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = true;
}
function habilitarPasarTurno() {
  const btn = document.getElementById("btn-turno");
  if (btn) btn.disabled = false;
}

async function actualizarUICompleta() {
  jugadores = await cargarJugadores();
  casillasVisibles = determinarCasillasVisibles();
  renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
  renderizarBarraJugadores(jugadores);
  renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

  mostrarAccionesCasillaParaJugadorActual();
}

function mostrarAccionesCasillaParaJugadorActual() {
  const jugador = jugadores[indiceTurno];
  if (!jugador || !tableroData?.casillas) return;
  const pos = typeof jugador.posicionActual === "number" ? jugador.posicionActual : 0;
  const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;
  if (!casillaActual) {
    const cont = document.getElementById("acciones-casilla");
    if (cont) cont.innerHTML = "";
    return;
  }

  mostrarAccionesCasillaDOM(
    jugador,
    casillaActual,
    jugadores,
    tableroData,
    {
      actualizarUI: actualizarUICompleta,
      bloquearPasarTurno,
      habilitarPasarTurno
    }
  );
}

// ======================== INIT ========================
window.onload = async () => {
  try {
    await cargarTablero(tableroData);
    jugadores = await cargarJugadores();

    casillasVisibles = determinarCasillasVisibles();
    renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    mostrarAccionesCasillaParaJugadorActual();
    renderizarBarraJugadores(jugadores);

    renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

    setEstadoBotones("no-iniciado");

    // ▶️ Iniciar / Finalizar juego
    document.getElementById("btn-inicio").addEventListener("click", () => {
      juegoIniciado ? finalizarJuego() : iniciarJuego();
    });

    // 🎲 Tirar dados
    document.getElementById("btn-dados").addEventListener("click", () =>
      tirarDados(
        jugadores,
        indiceTurno,
        tableroData,
        casillasVisibles,
        calcularRangoVisible,
        puedeTirar,
        v => (puedeTirar = v),
        v => (haMovido = v),
        actualizarUICompleta

      )
      
    );

    // 👣 Mover manualmente
    document.getElementById("btn-mover").addEventListener("click", async () => {
      const input = document.getElementById("input-pasos");
      const pasos = parseInt(input.value);

      if (!isNaN(pasos) && pasos > 0) {
        moverJugador(
          jugadores[indiceTurno].id,
          pasos,
          jugadores,
          tableroData,
          casillasVisibles,
          calcularRangoVisible
        );

        haMovido = true; // ✅ cuenta como movimiento de turno

        // 🔄 resetear acción pendiente al moverse
        if (jugadores[indiceTurno]) {
          jugadores[indiceTurno].accionResuelta = false;
        }

        // 🔄 refrescar tablero y perfil
        await actualizarUICompleta();

        // 👀 actualizar casilla actual
        //mostrarAccionesCasillaParaJugadorActual();

        renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
        renderizarBarraJugadores(jugadores);
        renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);

        setEstadoBotones("jugando");

        mostrarAccionesCasillaParaJugadorActual();
      }

      input.value = "";
    });


    // ⏭️ Cambiar turno
    document.getElementById("btn-turno").addEventListener("click", async () => {
      const jugadorActual = jugadores[indiceTurno];
      const pos = typeof jugadorActual.posicionActual === "number" ? jugadorActual.posicionActual : 0;
      const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;
      
      // 🔍 DEBUG - AGREGAR ESTOS LOGS
      console.log("=== DEBUG PASAR TURNO ===");
      console.log("Jugador actual:", jugadorActual.nombre);
      console.log("Posición:", pos);
      console.log("Casilla actual:", casillaActual);
      console.log("Tipo de casilla:", casillaActual?.type);
      console.log("haMovido:", haMovido);
      console.log("accionResuelta:", jugadorActual.accionResuelta);
      
      // Buscar propietario
      const propietario = jugadores.find(j => 
        (j.propiedades || []).some(p => Number(p.idPropiedad) === Number(casillaActual?.id))
      );
      console.log("Propietario encontrado:", propietario?.nombre || "ninguno");
      console.log("Es propiedad de otro:", propietario && propietario.id !== jugadorActual.id);
      
      // Verificar pendientes
      const pendientes = tienePendientes(jugadorActual, casillaActual, jugadores);    
      console.log("Tiene pendientes:", pendientes);
      console.log("========================");
      
      // Si el jugador está en la cárcel, verificar si ya usó su turno
      if (jugadorActual.enCarcel) {
        // Si está en cárcel y no ha tirado dados (haMovido = false), debe tirar primero
        if (!haMovido) {
          alert("Estás en la cárcel. Debes tirar los dados o pagar la fianza antes de pasar turno.");
          return;
        }
        // Si ya tiró dados en la cárcel (haMovido = true), puede pasar turno
      } else {
        // Para jugadores no encarcelados, deben haber tirado dados Y completado acciones
        if (!haMovido) {
          alert("Debes tirar los dados antes de pasar turno.");
          return;
        }
        
        // Verificar si tienen acciones pendientes sin resolver
        const pos = typeof jugadorActual.posicionActual === "number" ? jugadorActual.posicionActual : 0;
        const casillaActual = tableroData.casillas.find(c => c.id === pos) ?? tableroData.casillas[pos] ?? null;

        if (tienePendientes(jugadorActual, casillaActual) && !jugadorActual.accionResuelta) {
          alert("No puedes pasar el turno: primero resuelve la acción de esta casilla.");
          return;
        }
      }

      // Verificar deuda pendiente (aplica a todos)
      if ((jugadorActual?.deudaBanco || 0) > 0) {
        alert("Tienes deuda pendiente. Vende propiedades o hipoteca para cubrirla antes de pasar turno.");
        return;
      }

      // Proceder con el cambio de turno
      cambiarTurno(
        jugadores,
        indiceTurno,
        v => (indiceTurno = v),
        v => (puedeTirar = v),
        v => (haMovido = v)
      );

      // 🔄 ACTUALIZAR INMEDIATAMENTE después del cambio de turno
      // Recargar jugadores desde localStorage para asegurar sincronización
      jugadores = await cargarJugadores();
      
      // Actualizar todas las partes de la UI inmediatamente
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
      renderizarBarraJugadores(jugadores);
      
      // Renderizar perfil del NUEVO jugador actual (ahora indiceTurno ya cambió)
      renderizarPerfilJugador(jugadores[indiceTurno], tableroData, actualizarUICompleta);
      
      resetMazoState();
      resetPanelCarta();
      
      // Mostrar acciones de la casilla del nuevo jugador
      mostrarAccionesCasillaParaJugadorActual();
    });

    // 🔄 Redimensionar tablero
    window.addEventListener("resize", () => {
      casillasVisibles = determinarCasillasVisibles();
      renderizarTablero(tableroData, jugadores, casillasVisibles, calcularRangoVisible);
    });
    } catch (err) {
      console.error("❌ Error iniciando el juego:", err);
    }
};
