// property_handlers.js
// Manejo específico de propiedades y acciones relacionadas
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";

/**
 * Marca y persiste que el jugador resolvió la acción de su casilla.
 */
function marcarAccionResuelta(miJug) {
  try {
    miJug.accionResuelta = true;
    const js = getJugadoresLS();
    const idx = js.findIndex(j => j.id === miJug.id);
    if (idx >= 0) {
      js[idx].accionResuelta = true;
      replaceJugadores(js);
    }
  } catch (e) {
    console.error("Error persisting accionResuelta:", e);
  }
}

/**
 * Maneja propiedad sin dueño - opción de compra
 */
export function handleUnownedProperty(jugador, casilla, cont, callbacks) {
  const necesita = Math.max(0, (Number(casilla.price) || 0) - (Number(jugador.dinero) || 0));
  const puedeComprar = (Number(jugador.dinero) || 0) >= (Number(casilla.price) || 0);
  
  const comprar = document.createElement("button");
  comprar.className = "accion-btn";
  comprar.textContent = `Comprar $${casilla.price}`;
  comprar.disabled = !puedeComprar;
  comprar.title = !puedeComprar ? `No tienes suficiente dinero. Necesitas $${necesita}` : "";
  
  comprar.addEventListener("click", () => {
    const res = ACC.comprarPropiedad(jugador.id, casilla);
    if (res.ok) {
      marcarAccionResuelta(jugador);
      callbacks.actualizarUI && callbacks.actualizarUI();
      cont.innerHTML = "";
    } else if (res.reason === "sin-dinero") {
      alert("No tienes suficiente dinero para comprar esta propiedad.");
      callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
    } else {
      alert("Error: " + res.reason);
    }
  });
  
  cont.appendChild(comprar);
}

/**
 * Maneja pago de renta a otro propietario
 */
// Reemplaza la implementación de handleRentPayment en control_propiedades.js por esta.
// Nota: adapta nombres de propiedades si tu estructura difiere (ej. jugador.money vs jugador.dinero).
export async function handleRentPayment(jugador, casilla, propietario, cont, callbacks) {
  try {
    // 1) Determinar monto de renta de forma robusta
    let monto = 0;

    // Caso simple: casilla.rent es número
    if (typeof casilla.rent === "number") {
      monto = casilla.rent;
    } else if (casilla.rent && typeof casilla.rent === "object") {
      // Intentar extraer un valor razonable desde posibles estructuras:
      // - casilla.rent.base
      // - casilla.rent[0]
      // - casilla.rent.standard
      if (typeof casilla.rent.base === "number") monto = casilla.rent.base;
      else if (typeof casilla.rent.standard === "number") monto = casilla.rent.standard;
      else if (Array.isArray(casilla.rent) && typeof casilla.rent[0] === "number") monto = casilla.rent[0];
      else {
        // fallback: si hay houses/hotels intenta usar la propiedad
        if (typeof casilla.houses === "number" && casilla.houses > 0 && typeof casilla.rent[casilla.houses] === "number") {
          monto = casilla.rent[casilla.houses];
        }
      }
    }

    // Si aun así no tenemos monto, usar un fallback: 10% del precio o 50 si no hay price
    if (!monto || isNaN(monto) || monto <= 0) {
      if (typeof casilla.price === "number" && casilla.price > 0) monto = Math.round(casilla.price * 0.10);
      else monto = 50; // valor por defecto razonable
    }

    // 2) Aplicar lógica de pago (intentar mutar los objetos en memoria)
    // Aquí asumimos que `jugador.dinero` y `propietario.dinero` existen.
    // Protegemos contra valores inesperados usando Number(...)
    const antesJugador = Number(jugador.dinero ?? jugador.money ?? 0);
    const antesProp = Number(propietario.dinero ?? propietario.money ?? 0);

    // Si el jugador no tiene suficiente dinero, se define comportamiento simple:
    if (antesJugador < monto) {
      // Puedes adaptar esto: hipotecar, bancarrota, pagar lo que pueda, etc.
      // Por ahora cobramos todo lo que tiene (pago parcial) y marcamos bancarrota si queda 0.
      monto = antesJugador;
    }

    // Mutar dinero en los objetos (esto es lo que ui_acciones esperaba)
    if (typeof jugador.dinero !== "undefined") jugador.dinero = antesJugador - monto;
    else if (typeof jugador.money !== "undefined") jugador.money = antesJugador - monto;

    if (typeof propietario.dinero !== "undefined") propietario.dinero = antesProp + monto;
    else if (typeof propietario.money !== "undefined") propietario.money = antesProp + monto;

    // Marcar acción resuelta en jugador (si esa propiedad existe en tu modelo)
    if (typeof jugador.accionResuelta !== "undefined") jugador.accionResuelta = true;
    else jugador.accionResuelta = true;

    // Opcional: update UI del panel de acciones (si esperas mostrar mensaje)
    try {
      if (cont) {
        const info = document.createElement("div");
        info.style.padding = "8px";
        info.style.fontSize = "14px";
        info.textContent = `${jugador.nombre ?? jugador.name ?? "Jugador"} pagó $${monto} por ${casilla.name ?? "esta propiedad"}.`;
        cont.appendChild(info);
      }
    } catch (err) {
      // no bloqueamos por errores de DOM
      console.debug("[control_propiedades] aviso UI:", err);
    }

    // 3) Devolver el monto pagado para que quien llame pueda registrarlo (fallback para pagos remotos)
    return monto;
  } catch (err) {
    console.error("[control_propiedades] handleRentPayment fallo:", err);
    // No propagues el ReferenceError: devolvemos 0 en fallo total
    return 0;
  }
}


/**
 * Maneja propiedades del jugador actual - opciones de gestión
 */
export function handleOwnedProperty(jugador, casilla, cont, callbacks, tableroData) {
  const propiedadObj = (jugador.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id)) 
    || { casas: 0, hotel: 0, hipotecado: false };
  
  const tieneCasas = (Number(propiedadObj.casas) || 0) > 0;
  const tieneHotel = (Number(propiedadObj.hotel) || 0) > 0;
  const hayConstruccionEnEsta = tieneCasas || tieneHotel;

  const grid = document.createElement("div");
  grid.className = "acciones-grid";
  grid.style.display = "flex";
  grid.style.flexDirection = "column";
  grid.style.gap = "10px";

  // Crear botones de gestión
  createMortgageButton(jugador, casilla, propiedadObj, tableroData, grid, callbacks);
  createSellPropertyButton(jugador, casilla, propiedadObj, tableroData, grid, callbacks, hayConstruccionEnEsta);
  createConstructionButtons(jugador, casilla, propiedadObj, tableroData, grid, callbacks);
  
  cont.appendChild(grid);

  // Iconos para vender construcciones existentes
  if (hayConstruccionEnEsta) {
    createConstructionIcons(jugador, casilla, propiedadObj, tableroData, cont, callbacks);
  }
}

/**
 * Crea botón de hipoteca/deshipoteca
 */
function createMortgageButton(jugador, casilla, propiedadObj, tableroData, container, callbacks) {
  const colorCasilla = casilla.color || null;
  const hipVal = Number(casilla.mortgage ?? Math.floor((Number(casilla.price) || 0) / 2));
  const esHip = !!propiedadObj.hipotecado;
  const costoDeship = Math.ceil(hipVal * 1.1);
  const hayConstruccionesEnColor = ACC.tieneConstruccionesEnColor(jugador, tableroData, colorCasilla);
  
  const hipDisabled = hayConstruccionesEnColor || (esHip ? ((Number(jugador.dinero) || 0) < costoDeship) : false);
  const hipDisabledTitle = hayConstruccionesEnColor
    ? "No puedes hipotecar: existen casas u hoteles en propiedades de este color."
    : (esHip ? `Necesitas $${costoDeship} para deshipotecar` : "");
  
  const hipText = esHip ? `Deshipotecar $${costoDeship}` : `Hipotecar $${hipVal}`;
  
  const hipBtn = document.createElement("button");
  hipBtn.className = "accion-btn";
  hipBtn.textContent = hipText;
  hipBtn.disabled = hipDisabled;
  hipBtn.title = hipDisabledTitle;
  
  hipBtn.addEventListener("click", () => {
    const res = ACC.toggleHipoteca(jugador.id, casilla);
    if (res.ok) {
      callbacks.actualizarUI && callbacks.actualizarUI();
      container.parentElement.innerHTML = "";
    } else {
      alert("No se pudo (des)hipotecar: " + res.reason);
    }
  });
  
  container.appendChild(hipBtn);
}

/**
 * Crea botón para vender propiedad
 */
function createSellPropertyButton(jugador, casilla, propiedadObj, tableroData, container, callbacks, hayConstruccionEnEsta) {
  const puedeVenderProp = ACC.puedeVenderPropiedad(jugador, tableroData, casilla) && !hayConstruccionEnEsta;
  
  if (puedeVenderProp) {
    const venderPropBtn = document.createElement("button");
    venderPropBtn.className = "accion-btn";
    venderPropBtn.textContent = `Vender Propiedad (recibe ${Math.floor((Number(casilla.price)||0)/2)})`;
    
    venderPropBtn.addEventListener("click", () => {
      if (!confirm("¿Confirmas vender esta propiedad?")) return;
      const res = ACC.venderPropiedad(jugador.id, tableroData, casilla);
      if (res.ok) {
        callbacks.actualizarUI && callbacks.actualizarUI();
        container.parentElement.innerHTML = "";
      } else {
        alert("No se pudo vender: " + res.reason);
      }
    });
    
    container.appendChild(venderPropBtn);
  }
}

/**
 * Crea botones de construcción (casas/hoteles)
 */
function createConstructionButtons(jugador, casilla, propiedadObj, tableroData, container, callbacks) {
  const precioCasa = ACC.precioCasa(casilla);
  const precioHotel = ACC.precioHotel(casilla);

  if ((Number(propiedadObj.hotel) || 0) > 0) {
    // Botón para vender hotel
    const ventaHotelBtn = document.createElement("button");
    ventaHotelBtn.className = "accion-btn";
    ventaHotelBtn.textContent = `Vender Hotel (recibe ${Math.ceil(precioHotel/2)})`;
    
    ventaHotelBtn.addEventListener("click", async () => {
      if (!confirm("¿Confirmas vender el hotel por la mitad del precio?")) return;
      const res = ACC.venderHotel(jugador.id, tableroData, casilla);
      if (res.ok) { 
        callbacks.actualizarUI && callbacks.actualizarUI(); 
        container.parentElement.innerHTML = ""; 
      } else {
        alert("No se pudo vender hotel: " + res.reason);
      }
    });
    
    container.appendChild(ventaHotelBtn);
  } else {
    // Botones para comprar casa/hotel
    const tieneMono = ACC.tieneMonopolio(jugador, tableroData, casilla.id);
    const colorCasilla = casilla.color || null;
    const todas4 = ACC.todasPropiedadesCon4(jugador, tableroData, colorCasilla);
    const puedeComprarCasa = tieneMono && !propiedadObj.hipotecado && (Number(jugador.dinero) || 0) >= precioCasa && (Number(propiedadObj.casas) || 0) < 4;
    const puedeComprarHotel = tieneMono && !propiedadObj.hipotecado && (Number(propiedadObj.hotel) || 0) === 0 && todas4 && (Number(jugador.dinero) || 0) >= precioHotel;

    let construirTitle = "";
    if (!tieneMono) construirTitle = "Requiere monopolio de color";
    else if (propiedadObj.hipotecado) construirTitle = "La propiedad está hipotecada";
    else if (!todas4 && (Number(propiedadObj.casas) || 0) >= 4) construirTitle = "Para comprar hotel, todas las propiedades del color deben tener 4 casas (las que ya tienen hotel cuentan)";
    else if ((Number(jugador.dinero) || 0) < precioHotel && todas4) construirTitle = `Necesitas $${Math.max(0, precioHotel - (Number(jugador.dinero)||0))} para comprar hotel`;

    const textoConstruir = ((Number(propiedadObj.casas) || 0) < 4) ? `Comprar Casa $${precioCasa}` : `Comprar Hotel $${precioHotel}`;
    const disabledConstruir = ((Number(propiedadObj.casas) || 0) < 4) ? !puedeComprarCasa : !puedeComprarHotel;
    
    const construirBtn = document.createElement("button");
    construirBtn.className = "accion-btn";
    construirBtn.textContent = textoConstruir;
    construirBtn.disabled = disabledConstruir;
    construirBtn.title = construirTitle;
    
    construirBtn.addEventListener("click", () => {
      if ((Number(propiedadObj.casas) || 0) < 4) {
        const res = ACC.comprarCasa(jugador.id, tableroData, casilla);
        if (res.ok) { 
          callbacks.actualizarUI && callbacks.actualizarUI(); 
          container.parentElement.innerHTML = ""; 
        } else {
          alert("No se pudo comprar casa: " + res.reason);
        }
      } else {
        const res = ACC.comprarHotel(jugador.id, tableroData, casilla);
        if (res.ok) { 
          callbacks.actualizarUI && callbacks.actualizarUI(); 
          container.parentElement.innerHTML = ""; 
        } else {
          alert("No se pudo comprar hotel: " + res.reason);
        }
      }
    });
    
    container.appendChild(construirBtn);
  }
}

/**
 * Crea iconos para vender construcciones individuales
 */
function createConstructionIcons(jugador, casilla, propiedadObj, tableroData, container, callbacks) {
  const ICONS = {
    house: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3l9 7v11a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10l9-7z"/></svg>`,
    hotel: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 21h18v-9H3v9zm2-7h14v5H5v-5zM7 9V7h10v2H7z"/></svg>`
  };

  const iconRow = document.createElement("div");
  iconRow.className = "icon-row";
  iconRow.style.display = "flex";
  iconRow.style.gap = "8px";
  iconRow.style.marginTop = "12px";

  // Iconos para casas
  for (let i = 0; i < (Number(propiedadObj.casas) || 0); i++) {
    const casaBtn = document.createElement("button");
    casaBtn.className = "accion-icono";
    casaBtn.innerHTML = ICONS.house;
    casaBtn.title = "Vender casa";
    casaBtn.setAttribute("aria-label", "Vender casa");
    
    casaBtn.addEventListener("click", async () => {
      if (!confirm("Vender esta casa por la mitad del precio?")) return;
      const res = ACC.venderCasa(jugador.id, tableroData, casilla);
      if (res.ok) { 
        callbacks.actualizarUI && callbacks.actualizarUI(); 
        container.innerHTML = ""; 
      } else {
        alert("No se pudo vender casa: " + res.reason);
      }
    });
    
    iconRow.appendChild(casaBtn);
  }

  // Icono para hotel
  if ((Number(propiedadObj.hotel) || 0) > 0) {
    const hotelBtn = document.createElement("button");
    hotelBtn.className = "accion-icono";
    hotelBtn.innerHTML = ICONS.hotel;
    hotelBtn.title = "Vender hotel";
    hotelBtn.setAttribute("aria-label", "Vender hotel");
    
    hotelBtn.addEventListener("click", async () => {
      if (!confirm("Vender hotel por la mitad del precio?")) return;
      const res = ACC.venderHotel(jugador.id, tableroData, casilla);
      if (res.ok) { 
        callbacks.actualizarUI && callbacks.actualizarUI(); 
        container.innerHTML = ""; 
      } else {
        alert("No se pudo vender hotel: " + res.reason);
      }
    });
    
    iconRow.appendChild(hotelBtn);
  }

  container.appendChild(iconRow);
}