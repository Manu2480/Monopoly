// ui_acciones.js
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";
import { obtenerCarta, voltearCartaEnPanel, resetPanelCarta } from "./cartas_tablero.js";

/**
 * Estado del mazo abierto: evita voltear múltiples cartas a la vez.
 * true = hay una carta volteada pendiente de aplicar (o hasta que se cierre).
 */
let mazoAbierto = false;

/* ---------- ICONOS SVG (pequeños, inline) ---------- */
const ICONS = {
  house: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3l9 7v11a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10l9-7z"/></svg>`,
  hotel: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 21h18v-9H3v9zm2-7h14v5H5v-5zM7 9V7h10v2H7z"/></svg>`,
  mortgage: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2L2 7v13h20V7L12 2zm0 2.18L18 8v10H6V8l6-3.82zM11 11h2v6h-2z"/></svg>`,
  sell: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 6v13a2 2 0 0 0 2 2h14V6L12 2 3 6zM12 12l4-4-1.4-1.4L12 9.2 9.4 6.6 8 8l4 4z"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>`
};

/* ---------- HELPERS UI ---------- */

function crearBtn(text, cb, disabled = false, disabledTitle = "") {
  const b = document.createElement("button");
  b.className = "accion-btn";
  b.type = "button";
  b.textContent = text;
  b.disabled = !!disabled;
  b.addEventListener("click", cb);
  b.title = disabled ? (disabledTitle || text) : text;
  return b;
}

function crearIconBtn(iconName, cb, title = "") {
  const b = document.createElement("button");
  b.className = "accion-icono";
  b.type = "button";
  b.innerHTML = ICONS[iconName] || "";
  b.addEventListener("click", cb);
  b.title = title;
  // accesibilidad mínima
  b.setAttribute("aria-label", title || iconName);
  return b;
}

export function clearAccionesCasilla() {
  const cont = document.getElementById("acciones-casilla");
  if (cont) cont.innerHTML = "";
}

/* Muestra información minimal de la casilla en el panel (solo lectura) */
export function renderPanelCasilla(casilla) {
  const mazo = document.getElementById("panel-casilla");
  if (!mazo) return;
  if (!casilla) {
    resetPanelCarta();
    return;
  }
  const tipo = casilla.type || "generic";
  const nombre = casilla.name || `Casilla ${casilla.id}`;
  let descripcion = "";
  switch (tipo) {
    case "property":
      descripcion += `<div><strong>Propiedad</strong></div>`;
      if (casilla.color) descripcion += `<div>Color: <span style="display:inline-block;width:12px;height:12px;background:${casilla.color};border-radius:3px;margin-left:6px;vertical-align:middle;"></span></div>`;
      if (casilla.price !== undefined) descripcion += `<div>Precio: $${casilla.price}</div>`;
      break;
    case "chance":
      descripcion += `<div><strong>Sorpresa (Chance)</strong></div>`;
      break;
    case "community_chest":
      descripcion += `<div><strong>Caja de Comunidad</strong></div>`;
      break;
    case "tax":
      descripcion += `<div><strong>Impuesto</strong></div>`;
      if (casilla.action && typeof casilla.action.money === "number") descripcion += `<div>Monto: $${Math.abs(casilla.action.money)}</div>`;
      break;
    default:
      descripcion += `<div><strong>${tipo}</strong></div>`;
  }
  mazo.innerHTML = `<div style="padding:8px;">
    <div style="font-weight:700; margin-bottom:6px;">${nombre}</div>
    <div style="font-size:13px;">${descripcion}</div>
  </div>`;
}

/**
 * mostrarAccionesCasillaDOM(jugadorActual, casilla, jugadores, tableroData, callbacks)
 * callbacks: { actualizarUI, bloquearPasarTurno, habilitarPasarTurno }
 */
export function mostrarAccionesCasillaDOM(jugadorActual, casilla, jugadores, tableroData, callbacks = {}) {
  const cont = document.getElementById("acciones-casilla");
  if (!cont) return;
  cont.innerHTML = "";

  renderPanelCasilla(casilla);
  if (!jugadorActual) return;

  const miJug = jugadorActual;
  const propietario = Array.isArray(jugadores) ? jugadores.find(j => (j.propiedades || []).some(p => Number(p.idPropiedad) === Number(casilla?.id))) : null;

  // ---------- CARTAS (chance / community) ----------
  if (casilla.type === "chance" || casilla.type === "community_chest") {
    const tipoMazo = casilla.type;
    // Si ya hay una carta abierta (mazoAbierto) no permitimos voltear otra
    const voltearBtn = crearBtn("Voltear carta", () => {
      if (mazoAbierto) return; // prevención extra
      const carta = obtenerCarta(tipoMazo, tableroData);
      if (!carta) { alert("No hay cartas en el mazo."); return; }

      // marcar que hay carta abierta y bloquear pasar turno mientras no se aplique la acción
      mazoAbierto = true;
      voltearBtn.disabled = true;
      callbacks && callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();

      // pintar carta en panel
      voltearCartaEnPanel(carta);

      // limpiar panel de acciones (debajo) y mostrar solo el botón de aplicar (o aceptar)
      cont.innerHTML = "";

      if (carta.action && typeof carta.action.money === "number") {
        const monto = carta.action.money;
        const texto = monto < 0 ? `Pagar $${Math.abs(monto)}` : `Recibir $${Math.abs(monto)}`;
        const aplicarBtn = crearBtn(texto, () => {
          if (monto < 0) {
            // intento pagar
            const res = ACC.intentarPagar(miJug.id, Math.abs(monto));
            if (res.ok) {
              // pago completado -> permitir pasar turno
              callbacks.actualizarUI && callbacks.actualizarUI();
              callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
              alert(`Has pagado $${Math.abs(monto)}.`);
            } else {
              // pago insuficiente -> bloquear pasar turno y avisar (se mantiene mazoAbierto si quieres forzar venta)
              if (res.reason === "insuficiente") {
                alert("No tienes suficiente dinero. Vende o hipoteca propiedades. No puedes pasar turno hasta cubrir la deuda.");
                callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
                callbacks.actualizarUI && callbacks.actualizarUI();
              } else {
                alert("Error al pagar: " + res.reason);
                // liberamos mazo para no bloquear permanentemente
                mazoAbierto = false;
                callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
              }
            }
          } else {
            // recibir dinero: actualizar LS y permitir pasar turno
            const js = getJugadoresLS();
            const j = js.find(x => x.id === miJug.id);
            if (j) {
              j.dinero = (Number(j.dinero) || 0) + Number(monto);
              replaceJugadores(js);
              callbacks.actualizarUI && callbacks.actualizarUI();
              callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
              alert(`Has recibido $${monto}.`);
            } else {
              alert("Error interno: jugador no encontrado.");
            }
          }

          // acción aplicada -> cerrar mazo y permitir nuevas cartas
          mazoAbierto = false;
          cont.innerHTML = "";
          // reset visual del panel (opcional)
          resetPanelCarta();
        });
        cont.appendChild(aplicarBtn);
      } else {
        // carta sin acción monetaria -> mostrar Aceptar y liberar
        const aceptar = crearBtn("Aceptar", () => {
          mazoAbierto = false;
          cont.innerHTML = "";
          resetPanelCarta();
          callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        });
        cont.appendChild(aceptar);
      }
    }, mazoAbierto, mazoAbierto ? "Ya hay una carta abierta. Aplica o cierra antes de voltear otra." : "");
    cont.appendChild(voltearBtn);
    return;
  }

  // ---------- TAX ----------
  if (casilla.type === "tax" && casilla.action && typeof casilla.action.money === "number") {
    const monto = Math.abs(casilla.action.money);
    if (casilla.action.money < 0) {
      const pagarBtn = crearBtn(`Pagar $${monto}`, () => {
        const res = ACC.intentarPagar(miJug.id, monto);
        if (res.ok) {
          callbacks.actualizarUI && callbacks.actualizarUI();
          callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        } else {
          if (res.reason === "insuficiente") {
            alert("Insuficiente. Vende o hipoteca propiedades.");
            callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
            callbacks.actualizarUI && callbacks.actualizarUI();
          } else {
            alert("Error: " + res.reason);
          }
        }
      });
      cont.appendChild(pagarBtn);
      // bloquear pasar turno hasta que se haya pagado o el usuario haga acción compensatoria
      return;
    } else {
      const cobrar = crearBtn(`Cobrar $${monto}`, () => {
        const js = getJugadoresLS(); const j = js.find(x => x.id === miJug.id); if (j) { j.dinero = (Number(j.dinero) || 0) + monto; replaceJugadores(js); callbacks.actualizarUI && callbacks.actualizarUI(); }
      });
      cont.appendChild(cobrar);
      return;
    }
  }

  // ---------- PROPIEDAD / RAILROAD ----------
  if (casilla.type === "property" || casilla.type === "railroad") {
    // Sin dueño -> comprar
    if (!propietario) {
      const necesita = Math.max(0, (Number(casilla.price) || 0) - (Number(miJug.dinero) || 0));
      const puedeComprar = (Number(miJug.dinero) || 0) >= (Number(casilla.price) || 0);
      const comprar = crearBtn(`Comprar $${casilla.price}`, () => {
        const res = ACC.comprarPropiedad(miJug.id, casilla);
        if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
        else if (res.reason === "sin-dinero") {
          alert("No tienes suficiente dinero para comprar esta propiedad.");
          callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
        } else alert("Error: " + res.reason);
      }, !puedeComprar, !puedeComprar ? `No tienes suficiente dinero. Necesitas $${necesita}` : "");
      cont.appendChild(comprar);
      return;
    }

    // Propiedad de otro -> pagar renta
    if (propietario.id !== miJug.id) {
      const propDelDue = (propietario.propiedades || []).find(p => Number(p.idPropiedad) === Number(casilla.id));
      let renta = Number(casilla.rent?.base ?? Math.round((Number(casilla.price) || 0) * 0.1));
      if (propDelDue) {
        if ((Number(propDelDue.hotel) || 0) > 0) renta = Number(casilla.rent?.withHotel ?? renta * 5);
        else if ((Number(propDelDue.casas) || 0) > 0) {
          const idx = (Number(propDelDue.casas) || 0) - 1;
          renta = (casilla.rent?.withHouse && casilla.rent.withHouse[idx] !== undefined) ? casilla.rent.withHouse[idx] : Math.round(renta * (1 + (Number(propDelDue.casas) || 0)));
        }
      }
      const pagar = crearBtn(`Pagar renta $${renta}`, () => {
        const res = ACC.intentarPagar(miJug.id, renta);
        if (res.ok) {
          const js = getJugadoresLS();
          const due = js.find(j => j.id === propietario.id);
          if (due) { due.dinero = (Number(due.dinero) || 0) + renta; replaceJugadores(js); }
          callbacks.actualizarUI && callbacks.actualizarUI();
        } else {
          if (res.reason === "insuficiente") {
            alert("Insuficiente. Debes vender/hipotecar propiedades.");
            callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
            callbacks.actualizarUI && callbacks.actualizarUI();
          } else alert("Error al pagar: " + res.reason);
        }
      });
      cont.appendChild(pagar);
      return;
    }

    // Propiedad del jugador actual -> opciones (hipoteca, vender, construir)
    if (propietario.id === miJug.id) {
      const propiedadObj = (miJug.propiedades || []).find(pp => Number(pp.idPropiedad) === Number(casilla.id)) || { casas: 0, hotel: 0, hipotecado: false };
      const tieneCasas = (Number(propiedadObj.casas) || 0) > 0;
      const tieneHotel = (Number(propiedadObj.hotel) || 0) > 0;
      const hayConstruccionEnEsta = tieneCasas || tieneHotel;

      // contenedor
      const grid = document.createElement("div");
      grid.className = "acciones-grid";
      grid.style.display = "flex";
      grid.style.flexDirection = "column";
      grid.style.gap = "10px";

      const colorCasilla = casilla.color || null;

      // HIPOTECAR: nueva regla -> se habilita SOLO si NO hay construcciones en NINGUNA propiedad del color
      const hipVal = Number(casilla.mortgage ?? Math.floor((Number(casilla.price) || 0) / 2));
      const esHip = !!propiedadObj.hipotecado;
      const costoDeship = Math.ceil(hipVal * 1.1);
      const hayConstruccionesEnColor = ACC.tieneConstruccionesEnColor(miJug, tableroData, colorCasilla);
      const hipDisabled = hayConstruccionesEnColor || (esHip ? ((Number(miJug.dinero) || 0) < costoDeship) : false);
      const hipDisabledTitle = hayConstruccionesEnColor
        ? "No puedes hipotecar: existen casas u hoteles en propiedades de este color."
        : (esHip ? `Necesitas $${costoDeship} para deshipotecar` : "");
      const hipText = esHip ? `Deshipotecar $${costoDeship}` : `Hipotecar $${hipVal}`;
      const hipBtn = crearBtn(hipText, () => {
        const res = ACC.toggleHipoteca(miJug.id, casilla);
        if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
        else alert("No se pudo (des)hipotecar: " + res.reason);
      }, hipDisabled, hipDisabledTitle);
      grid.appendChild(hipBtn);

      // VENDER PROPIEDAD: mostrar SOLO si no hay construcciones en ESTA propiedad (si hay construcciones en color, igualmente no se puede hipotecar)
      const puedeVenderProp = ACC.puedeVenderPropiedad(miJug, tableroData, casilla) && !hayConstruccionEnEsta;
      if (puedeVenderProp) {
        const venderPropBtn = crearBtn(`Vender Propiedad (recibe ${Math.floor((Number(casilla.price)||0)/2)})`, () => {
          if (!confirm("¿Confirmas vender esta propiedad?")) return;
          const res = ACC.venderPropiedad(miJug.id, tableroData, casilla);
          if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
          else alert("No se pudo vender: " + res.reason);
        });
        grid.appendChild(venderPropBtn);
      }

      // Si hay HOTEL en esta casilla -> show "Vender Hotel" (icon + botón)
      const precioCasa = ACC.precioCasa(casilla);
      const precioHotel = ACC.precioHotel(casilla);

      if (tieneHotel) {
        const ventaHotelBtn = crearBtn(`Vender Hotel (recibe ${Math.ceil(precioHotel/2)})`, async () => {
          if (!confirm("¿Confirmas vender el hotel por la mitad del precio?")) return;
          const res = ACC.venderHotel(miJug.id, tableroData, casilla);
          if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
          else alert("No se pudo vender hotel: " + res.reason);
        });
        grid.appendChild(ventaHotelBtn);
      } else {
        // Mostrar Comprar Casa / Comprar Hotel segun correspondencia
        const tieneMono = ACC.tieneMonopolio(miJug, tableroData, casilla.id);
        const todas4 = ACC.todasPropiedadesCon4(miJug, tableroData, colorCasilla);
        const puedeComprarCasa = tieneMono && !propiedadObj.hipotecado && (Number(miJug.dinero) || 0) >= precioCasa && (Number(propiedadObj.casas) || 0) < 4;
        const puedeComprarHotel = tieneMono && !propiedadObj.hipotecado && (Number(propiedadObj.hotel) || 0) === 0 && todas4 && (Number(miJug.dinero) || 0) >= precioHotel;

        let construirTitle = "";
        if (!tieneMono) construirTitle = "Requiere monopolio de color";
        else if (propiedadObj.hipotecado) construirTitle = "La propiedad está hipotecada";
        else if (!todas4 && (Number(propiedadObj.casas) || 0) >= 4) construirTitle = "Para comprar hotel, todas las propiedades del color deben tener 4 casas (las que ya tienen hotel cuentan)";
        else if ((Number(miJug.dinero) || 0) < precioHotel && todas4) construirTitle = `Necesitas $${Math.max(0, precioHotel - (Number(miJug.dinero)||0))} para comprar hotel`;

        const textoConstruir = ((Number(propiedadObj.casas) || 0) < 4) ? `Comprar Casa $${precioCasa}` : `Comprar Hotel $${precioHotel}`;
        const disabledConstruir = ((Number(propiedadObj.casas) || 0) < 4) ? !puedeComprarCasa : !puedeComprarHotel;
        const construirBtn = crearBtn(textoConstruir, () => {
          if ((Number(propiedadObj.casas) || 0) < 4) {
            const res = ACC.comprarCasa(miJug.id, tableroData, casilla);
            if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
            else alert("No se pudo comprar casa: " + res.reason);
          } else {
            const res = ACC.comprarHotel(miJug.id, tableroData, casilla);
            if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
            else alert("No se pudo comprar hotel: " + res.reason);
          }
        }, disabledConstruir, construirTitle);
        grid.appendChild(construirBtn);
      }

      cont.appendChild(grid);

      // Iconos para vender casas/hotel (si existen en ESTA propiedad)
      if (hayConstruccionEnEsta) {
        const iconRow = document.createElement("div");
        iconRow.className = "icon-row";
        iconRow.style.display = "flex";
        iconRow.style.gap = "8px";
        iconRow.style.marginTop = "12px";

        for (let i = 0; i < (Number(propiedadObj.casas) || 0); i++) {
          const casaBtn = crearIconBtn("house", async () => {
            if (!confirm("Vender esta casa por la mitad del precio?")) return;
            const res = ACC.venderCasa(miJug.id, tableroData, casilla);
            if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
            else alert("No se pudo vender casa: " + res.reason);
          }, `Vender casa (recibir la mitad del precio: $${Math.ceil(precioCasa/2)})`);
          iconRow.appendChild(casaBtn);
        }

        if ((Number(propiedadObj.hotel) || 0) > 0) {
          const hotelBtn = crearIconBtn("hotel", async () => {
            if (!confirm("Vender hotel por la mitad del precio?")) return;
            const res = ACC.venderHotel(miJug.id, tableroData, casilla);
            if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
            else alert("No se pudo vender hotel: " + res.reason);
          }, `Vender hotel (recibir la mitad del precio: $${Math.ceil(precioHotel/2)})`);
          iconRow.appendChild(hotelBtn);
        }

        cont.appendChild(iconRow);
      }

      return;
    }
  }

  // default: limpiar
  cont.innerHTML = "";
}
