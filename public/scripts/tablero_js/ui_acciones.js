// ui_acciones.js
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";
import { obtenerCarta, voltearCartaEnPanel, resetPanelCarta } from "./cartas_tablero.js";

/* Helpers DOM */
function crearBtn(text, cb, disabled = false) {
  const b = document.createElement("button");
  b.className = "accion-btn";
  b.textContent = text;
  b.disabled = !!disabled;
  b.addEventListener("click", cb);
  return b;
}
export function clearAccionesCasilla() {
  const cont = document.getElementById("acciones-casilla");
  if (cont) cont.innerHTML = "";
}

/**
 * Muestra información simple de casilla en el panel.
 * (NO coloca botones; los botones van en #acciones-casilla)
 */
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
    case "special":
      descripcion += `<div><strong>${nombre}</strong></div>`;
      break;
    default:
      descripcion += `<div><strong>${tipo}</strong></div>`;
      break;
  }

  mazo.innerHTML = `<div style="padding:8px;">
    <div style="font-weight:700; margin-bottom:6px;">${nombre}</div>
    <div style="font-size:13px;">${descripcion}</div>
  </div>`;
}

/**
 * Mostrar las acciones de la casilla (botones en #acciones-casilla).
 * Además renderiza el panel con renderPanelCasilla(casilla).
 *
 * callbacks: { actualizarUI, bloquearPasarTurno, habilitarPasarTurno }
 */
export function mostrarAccionesCasillaDOM(jugadorActual, casilla, jugadores, tableroData, callbacks = {}) {
  const cont = document.getElementById("acciones-casilla");
  if (!cont) return;
  cont.innerHTML = "";

  // Renderizar panel (solo info) — el panel es #panel-casilla
  renderPanelCasilla(casilla);

  // encontrar propietario (buscamos en jugadores por propiedad)
  const propietario = jugadores.find(j => (j.propiedades || []).some(p => p.idPropiedad === casilla.id));

  // ---- Manejo específico para community_chest / chance (botón VOLTEAR debajo del panel) ----
  if (casilla.type === "chance" || casilla.type === "community_chest") {
    const tipoMazo = casilla.type; // 'chance' o 'community_chest'
    const voltearBtn = crearBtn("Voltear carta", () => {
      // Obtener carta aleatoria desde tableroData
      const carta = obtenerCarta(tipoMazo, tableroData);
      if (!carta) {
        alert("No hay cartas en este mazo.");
        return;
      }

      // Pintar carta en panel (esto actualiza #panel-casilla)
      voltearCartaEnPanel(carta);

      // Limpiar botones debajo y añadir el botón para aplicar acción (si existe)
      cont.innerHTML = "";

      // Si carta tiene acción de dinero
      if (carta.action && typeof carta.action.money === "number") {
        const monto = carta.action.money;
        const texto = monto < 0 ? `Pagar $${Math.abs(monto)}` : `Recibir $${Math.abs(monto)}`;
        const aplicarBtn = crearBtn(texto, () => {
          // Si monto negativo -> intentar pagar (respetando deuda)
          if (monto < 0) {
            const res = ACC.intentarPagar(jugadorActual.id, Math.abs(monto));
            if (res.ok) {
              callbacks.actualizarUI && callbacks.actualizarUI();
              callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
              alert(`Has pagado $${Math.abs(monto)} por la carta.`);
            } else {
              if (res.reason === "insuficiente") {
                alert("No tienes suficiente dinero. Vende o hipoteca propiedades. No puedes pasar turno hasta cubrir la deuda.");
                callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
                callbacks.actualizarUI && callbacks.actualizarUI();
              } else {
                alert("Error al pagar: " + res.reason);
              }
            }
          } else {
            // monto positivo -> sumar dinero al jugador
            const js = getJugadoresLS();
            const j = js.find(x => x.id === jugadorActual.id);
            if (j) {
              j.dinero = (j.dinero || 0) + monto;
              replaceJugadores(js);
              callbacks.actualizarUI && callbacks.actualizarUI();
              callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
              alert(`Has recibido $${monto} por la carta.`);
            } else {
              alert("Error interno: jugador no encontrado.");
            }
          }
          // limpiar botones debajo después de aplicar
          cont.innerHTML = "";
        });
        cont.appendChild(aplicarBtn);
      } else {
        // Sin acción económica -> botón Aceptar para cerrar
        const aceptar = crearBtn("Aceptar", () => {
          cont.innerHTML = "";
          callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        });
        cont.appendChild(aceptar);
      }
    });

    // Mostrar el botón VOLTEAR debajo del panel
    cont.appendChild(voltearBtn);
    return;
  }

  // ---- Casillas con action.money (tax u otras) ----
  if ((casilla.type === "tax") && casilla.action && typeof casilla.action.money === "number") {
    const monto = Math.abs(casilla.action.money);
    if (casilla.action.money < 0) {
      const btn = crearBtn(`Pagar $${monto}`, () => {
        const res = ACC.intentarPagar(jugadorActual.id, monto);
        if (res.ok) {
          callbacks.actualizarUI && callbacks.actualizarUI();
          callbacks.habilitarPasarTurno && callbacks.habilitarPasarTurno();
        } else {
          if (res.reason === "insuficiente") {
            alert("No tienes suficiente dinero para pagar. Vende o hipoteca propiedades. No puedes pasar turno hasta cubrir la deuda.");
            callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
            callbacks.actualizarUI && callbacks.actualizarUI();
          } else {
            alert("Error: " + res.reason);
          }
        }
      });
      cont.appendChild(btn);
      return;
    } else {
      const btn = crearBtn(`Cobrar $${monto}`, () => {
        const js = getJugadoresLS();
        const j = js.find(x => x.id === jugadorActual.id);
        if (j) {
          j.dinero = (j.dinero || 0) + monto;
          replaceJugadores(js);
        }
        callbacks.actualizarUI && callbacks.actualizarUI();
      });
      cont.appendChild(btn);
      return;
    }
  }

  // ---- Propiedad / Railroad / pagos/alquileres ----
  if (casilla.type === "property" || casilla.type === "railroad") {
    if (!propietario) {
      const comprarBtn = crearBtn(`Comprar $${casilla.price}`, () => {
        const res = ACC.comprarPropiedad(jugadorActual.id, casilla);
        if (res.ok) {
          casilla.ownerId = jugadorActual.id;
          callbacks.actualizarUI && callbacks.actualizarUI();
        } else {
          if (res.reason === "sin-dinero") {
            alert("No tienes suficiente dinero para comprar esta propiedad.");
            callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
          } else {
            alert("Error al comprar: " + res.reason);
          }
        }
      });
      cont.appendChild(comprarBtn);
      return;
    }

    if (propietario.id !== jugadorActual.id) {
      const propDelDueño = (propietario.propiedades || []).find(p => p.idPropiedad === casilla.id);
      let renta = casilla.rent?.base ?? Math.round((casilla.price || 0) * 0.1);

      if (propDelDueño) {
        if ((propDelDueño.hotel || 0) > 0) {
          renta = casilla.rent?.withHotel ?? renta * 5;
        } else if ((propDelDueño.casas || 0) > 0) {
          const idx = (propDelDueño.casas || 0) - 1;
          renta = (casilla.rent?.withHouse && casilla.rent.withHouse[idx] !== undefined) ? casilla.rent.withHouse[idx] : Math.round(renta * (1 + (propDelDueño.casas || 0)));
        }
      } else {
        renta = casilla.rent?.base ?? Math.round((casilla.price || 0) * 0.1);
      }

      const pagarBtn = crearBtn(`Pagar renta $${renta}`, () => {
        const res = ACC.intentarPagar(jugadorActual.id, renta);
        if (res.ok) {
          const js = getJugadoresLS();
          const due = js.find(j => j.id === propietario.id);
          if (due) {
            due.dinero = (due.dinero || 0) + renta;
            replaceJugadores(js);
          }
          callbacks.actualizarUI && callbacks.actualizarUI();
        } else {
          if (res.reason === "insuficiente") {
            alert("No tienes suficiente dinero para pagar la renta. Debes vender o hipotecar propiedades.");
            callbacks.bloquearPasarTurno && callbacks.bloquearPasarTurno();
            callbacks.actualizarUI && callbacks.actualizarUI();
          } else {
            alert("Error al pagar: " + res.reason);
          }
        }
      });
      cont.appendChild(pagarBtn);
      return;
    }

    if (propietario.id === jugadorActual.id) {
      // opciones del dueño: hipotecar, construir, vender (igual que antes)
      const p = (jugadorActual.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
      const hipVal = casilla.mortgage ?? Math.floor((casilla.price || 0) / 2);
      const hipText = (p && p.hipotecado) ? `Deshipotecar $${Math.ceil(hipVal * 1.1)}` : `Hipotecar $${hipVal}`;
      const hipBtn = crearBtn(hipText, () => {
        const res = ACC.toggleHipoteca(jugadorActual.id, casilla);
        if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
        else alert("No se pudo (des)hipotecar: " + res.reason);
      });
      cont.appendChild(hipBtn);

      const tieneMono = ACC.tieneMonopolio(jugadorActual, tableroData, casilla.id);
      const costoCasa = ACC.precioCasa(casilla);
      const comprarCasaBtn = crearBtn(`Comprar Casa $${costoCasa}`, () => {
        const res = ACC.comprarCasa(jugadorActual.id, tableroData, casilla);
        if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
        else alert("No se pudo comprar casa: " + res.reason);
      }, !tieneMono);
      cont.appendChild(comprarCasaBtn);

      const pProp = (jugadorActual.propiedades || []).find(pp => pp.idPropiedad === casilla.id);
      const tiene4 = (pProp && (pProp.casas || 0) >= 4);
      const costoHotel = ACC.precioHotel(casilla);
      const comprarHotelBtn = crearBtn(`Comprar Hotel $${costoHotel}`, () => {
        const res = ACC.comprarHotel(jugadorActual.id, tableroData, casilla);
        if (res.ok) callbacks.actualizarUI && callbacks.actualizarUI();
        else alert("No se pudo comprar hotel: " + res.reason);
      }, !tiene4);
      cont.appendChild(comprarHotelBtn);

      const venderBtn = crearBtn("Vender Propiedad", () => {
        const res = ACC.venderPropiedad(jugadorActual.id, tableroData, casilla);
        if (res.ok) {
          callbacks.actualizarUI && callbacks.actualizarUI();
        } else {
          alert("No se pudo vender: " + res.reason);
        }
      });
      cont.appendChild(venderBtn);

      return;
    }
  }

  // default: nada
  cont.innerHTML = "";
}

/* helper local para guardar jugadores del UI de renta */
function replaceJugadoresLocal(jugadoresArr) {
  // usamos la misma clave que api_tablero.cargarJugadores -> 'monopoly_jugadores'
  localStorage.setItem("monopoly_jugadores", JSON.stringify(jugadoresArr));
}
