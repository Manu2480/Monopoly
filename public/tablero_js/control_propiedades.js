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
export function handleRentPayment(jugador, casilla, propietario, cont, callbacks) {
  const propDelDue = (propietario.propiedades || []).find(p => Number(p.idPropiedad) === Number(casilla.id));
  let renta = Number(casilla.rent?.base ?? Math.round((Number(casilla.price) || 0) * 0.1));
  
  if (propDelDue) {
    if ((Number(propDelDue.hotel) || 0) > 0) {
      renta = Number(casilla.rent?.withHotel ?? renta * 5);
    } else if ((Number(propDelDue.casas) || 0) > 0) {
      const idx = (Number(propDelDue.casas) || 0) - 1;
      renta = (casilla.rent?.withHouse && casilla.rent.withHouse[idx] !== undefined) 
        ? casilla.rent.withHouse[idx] 
        : Math.round(renta * (1 + (Number(propDelDue.casas) || 0)));
    }
  }

  callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();

  const pagar = document.createElement("button");
  pagar.className = "accion-btn";
  pagar.textContent = `Pagar renta $${renta}`;
  
  pagar.addEventListener("click", () => {
    const res = ACC.intentarPagar(jugador.id, renta);
    if (res.ok) {
      const js = getJugadoresLS();
      const due = js.find(j => j.id === propietario.id);
      if (due) { 
        due.dinero = (Number(due.dinero) || 0) + renta; 
        replaceJugadores(js); 
      }
      marcarAccionResuelta(jugador);
      callbacks.actualizarUI && callbacks.actualizarUI();
      callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
      cont.innerHTML = "";
    } else {
      if (res.reason === "insuficiente") {
        alert("Insuficiente. Debes vender/hipotecar propiedades.");
        callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
        callbacks.actualizarUI && callbacks.actualizarUI();
      } else {
        alert("Error al pagar: " + res.reason);
        callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
      }
    }
  });
  
  cont.appendChild(pagar);
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