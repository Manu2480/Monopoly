// perfil_jugador_tablero.js
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";
import { crearIconoFicha, getNombreIcono } from "./utils_iconos.js";

// ---------- FUNCIONES AUXILIARES ----------
function formatMoney(n) {
  return (Number(n) || 0).toLocaleString();
}

// Función para calcular el patrimonio/score del jugador
function calcularPatrimonio(jugador, tableroData) {
  let valorPropiedades = 0;
  
  if (Array.isArray(jugador.propiedades) && tableroData?.casillas) {
    jugador.propiedades.forEach(p => {
      const propInfo = tableroData.casillas.find(c => Number(c.id) === Number(p.idPropiedad));
      const basePrice = propInfo ? (propInfo.price || 0) : 0;

      // Solo sumar valor si no está hipotecada
      if (!p.hipotecado) {
        valorPropiedades += basePrice;
        valorPropiedades += (p.casas || 0) * 100;
        valorPropiedades += (p.hotel || 0) * 200;
      }
    });
  }

  const dinero = Number(jugador.dinero) || 0;
  const deuda = Number(jugador.deudaBanco) || 0;
  const patrimonio = dinero + valorPropiedades - deuda;

  return {
    patrimonio,
    valorPropiedades,
    dinero,
    deuda
  };
}

// ---------- ICONOS SVG ----------
function svgIcon(name) {
  const icons = {
    coin: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h1a2 2 0 0 1 2 2v3c0 2.88-2.88 4.54-5.13 5.38L14 22h-4l-.87-7.62C6.88 13.54 4 11.88 4 9V6a2 2 0 0 1 2-2h1zM6 6v3c0 1.5 1.5 2.5 3 2.5V6H6zm9 5.5c1.5 0 3-1 3-2.5V6h-3v5.5z"/></svg>`,
    house: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3l9 7v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10l9-7z"/></svg>`,
    hotel: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 21h18v-9H3v9zm2-7h14v5H5v-5zM7 9V7h10v2H7z"/></svg>`,
    mortgage: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2L2 7v13h20V7L12 2zm0 2.18L18 8v10H6V8l6-3.82zM11 11h2v6h-2z"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`
  };
  return icons[name] || "";
}

/**
 * renderizarPerfilJugador(jugador, tableroData = null, actualizarUI = null)
 * - Versión actualizada con score/patrimonio
 */
export function renderizarPerfilJugador(jugador, tableroData = null, actualizarUI = null) {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (!perfilDiv) return;

  if (!jugador) {
    perfilDiv.innerHTML = "";
    return;
  }

  // Calcular patrimonio/score
  const { patrimonio, valorPropiedades, dinero, deuda } = calcularPatrimonio(jugador, tableroData);

  // Agrupar propiedades por color
  const grupos = {};
  (jugador.propiedades || []).forEach(p => {
    const casilla = tableroData?.casillas?.find(c => Number(c.id) === Number(p.idPropiedad))
      || { id: p.idPropiedad, name: `Propiedad #${p.idPropiedad}`, color: "gray" };

    const color = casilla.color || "sin-color";
    if (!grupos[color]) grupos[color] = [];

    grupos[color].push({
      idPropiedad: p.idPropiedad,
      nombre: casilla.name || `#${p.idPropiedad}`,
      casas: Number(p.casas) || 0,
      hotel: Number(p.hotel) || 0,
      hipotecado: !!p.hipotecado,
      precio: casilla.price || null,
      casilla
    });
  });

  const bandera = jugador.pais
    ? `<img src="https://flagcdn.com/24x18/${jugador.pais}.png" alt="${jugador.pais}" style="vertical-align:middle; margin-left:6px;">`
    : "";

  // Usar las funciones importadas de utils_iconos.js
  const iconoHtml = crearIconoFicha(jugador.ficha || "");

  // Construir HTML de secciones por color
  let seccionesHTML = "";
  const colores = Object.keys(grupos).sort((a,b) => (a||"").localeCompare(b||""));
  if (colores.length === 0) {
    seccionesHTML = `<div style="margin-top:8px;color:#666">Sin propiedades</div>`;
  } else {
    seccionesHTML = colores.map(color => {
      const props = grupos[color];
      const items = props.map(prop => {
        const hipIcon = prop.hipotecado ? `<span class="perfil-ico perfil-ico-mortgage" title="Hipotecada">${svgIcon("mortgage")}</span>` : "";
        const casasHtml = prop.casas > 0 ? `<span class="perfil-ico perfil-ico-house" title="${prop.casas} casas">${svgIcon("house")} <small style="margin-left:6px;font-weight:700;">x${prop.casas}</small></span>` : "";
        const hotelHtml = prop.hotel > 0 ? `<span class="perfil-ico perfil-ico-hotel" title="Hotel">${svgIcon("hotel")} <small style="margin-left:6px;font-weight:700;">x${prop.hotel}</small></span>` : "";
        const precioHtml = prop.precio ? `<div style="font-size:12px;color:#666;margin-top:6px">Precio: ${formatMoney(prop.precio)}</div>` : "";

        // botones de acción
        const accionesHtml = `
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;font-size:12px;">
            <button class="perfil-btn" data-accion="hipoteca" data-id="${prop.idPropiedad}">${prop.hipotecado ? "Deshipotecar" : "Hipotecar"}</button>
            <button class="perfil-btn" data-accion="vender" data-id="${prop.idPropiedad}">Vender</button>
            ${prop.casas > 0 ? `<button class="perfil-btn" data-accion="vender-casa" data-id="${prop.idPropiedad}">Vender Casa</button>` : ""}
            ${prop.hotel > 0 ? `<button class="perfil-btn" data-accion="vender-hotel" data-id="${prop.idPropiedad}">Vender Hotel</button>` : ""}
          </div>
        `;

        return `
          <li style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <div style="flex:1;">
                <div style="font-weight:700;">${prop.nombre} ${hipIcon ? hipIcon : ""}</div>
                <div style="margin-top:6px; font-size:13px; color:#444; display:flex; gap:10px; align-items:center;">
                  ${casasHtml}
                  ${hotelHtml}
                </div>
                ${precioHtml}
                ${accionesHtml}
              </div>
              <div style="width:18px;height:18px;border-radius:4px;background:${color};box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);"></div>
            </div>
          </li>
        `;
      }).join("");

      return `
        <details style="margin-bottom:10px" open>
          <summary style="font-weight:800; cursor:pointer; display:flex; align-items:center; gap:10px; list-style:none;">
            <span style="display:inline-flex;align-items:center;gap:8px;">
              <span style="display:inline-block;width:14px;height:14px;background:${color};border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);"></span>
              <span style="text-transform:uppercase;">${color}</span>
            </span>
            <small style="color:#666;font-weight:700;">– ${props.length}</small>
            <span style="margin-left:auto; opacity:0.7;">${svgIcon("chevron")}</span>
          </summary>
          <ul style="list-style:none;padding-left:0;margin-top:8px;margin-bottom:6px;">${items}</ul>
        </details>
      `;
    }).join("");
  }

  // Determinar color del score basado en el valor
  let scoreColor = "#666";
  let scoreIcon = svgIcon("coin");
  
  if (patrimonio > 2000) {
    scoreColor = "#4caf50"; // Verde para scores altos
    scoreIcon = svgIcon("trophy");
  } else if (patrimonio < 0) {
    scoreColor = "#f44336"; // Rojo para scores negativos
  }

  perfilDiv.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center; justify-content:space-between;">
      <div>
        <h2 style="margin:0 0 6px 0; font-size:18px; display:flex; align-items:center; gap:8px;">
          ${iconoHtml} ${jugador.nombre || "Jugador"}
          <span style="display:inline-block;width:20px;height:20px;background:${jugador.color || '#1D1D1D'};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);" title="Color del jugador"></span>
        </h2>
        <div style="font-size:13px;color:#444;">
          <span style="display:inline-block;margin-right:12px;"><strong>País:</strong> ${jugador.pais?.toUpperCase() || "??"} ${bandera}</span>
          <span style="display:inline-block;margin-right:12px;"><strong>Posición:</strong> Casilla #${jugador.posicionActual ?? 0}</span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;color:#666;">Dinero</div>
        <div style="font-weight:800; font-size:16px; display:flex; align-items:center; gap:8px; justify-content:flex-end;">
          <span style="display:inline-flex; align-items:center; gap:6px;">${svgIcon("coin")} <span>${formatMoney(dinero)}</span></span>
        </div>
      </div>
    </div>

    <!-- Sección de Score/Patrimonio -->
    <div style="margin:12px 0; padding:10px; background:linear-gradient(135deg, #f5f5f5, #e8e8e8); border-radius:8px; border-left:4px solid ${scoreColor};">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; color:#666; font-weight:600;">SCORE TOTAL</div>
          <div style="font-size:20px; font-weight:800; color:${scoreColor}; display:flex; align-items:center; gap:8px;">
            ${scoreIcon} <span>${formatMoney(patrimonio)}</span>
          </div>
        </div>
        <div style="text-align:right; font-size:12px; color:#666;">
          <div>Propiedades: ${formatMoney(valorPropiedades)}</div>
          ${deuda > 0 ? `<div style="color:#f44336;">Deuda: -${formatMoney(deuda)}</div>` : ""}
        </div>
      </div>
    </div>

    <hr style="margin:12px 0;border:none;border-top:1px solid rgba(0,0,0,0.06)">

    <h3 style="margin:6px 0 8px 0; font-size:15px;">Propiedades</h3>
    <div id="perfil-props">${seccionesHTML}</div>
  `;

  // 🔗 listeners para los botones de acción
  perfilDiv.querySelectorAll(".perfil-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idProp = Number(btn.dataset.id);
      const accion = btn.dataset.accion;
      const casilla = tableroData?.casillas?.find(c => Number(c.id) === idProp);
      if (!casilla) return;

      if (accion === "hipoteca") {
        ACC.toggleHipoteca(jugador.id, casilla);
      }
      if (accion === "vender") {
        if (confirm("¿Vender esta propiedad por la mitad de su precio?")) {
          ACC.venderPropiedad(jugador.id, tableroData, casilla);
        }
      }
      if (accion === "vender-casa") {
        ACC.venderCasa(jugador.id, tableroData, casilla);
      }
      if (accion === "vender-hotel") {
        ACC.venderHotel(jugador.id, tableroData, casilla);
      }

      if (typeof actualizarUI === "function") actualizarUI();
    });
  });
}

export function resetPerfilJugador() {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (perfilDiv) perfilDiv.innerHTML = "";
}