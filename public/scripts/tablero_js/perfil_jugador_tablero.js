// perfil_jugador_tablero.js
import * as ACC from "./acciones_tablero.js";
import { getJugadoresLS, replaceJugadores } from "./jugadores_estado.js";
import { crearIconoFicha, getNombreIcono } from "./utils_iconos.js";

// ---------- FUNCIONES AUXILIARES ----------
function formatMoney(n) {
  return (Number(n) || 0).toLocaleString();
}

// ---------- ICONOS SVG ----------
function svgIcon(name) {
  const icons = {
    coin: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>`,
    house: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3l9 7v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10l9-7z"/></svg>`,
    hotel: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 21h18v-9H3v9zm2-7h14v5H5v-5zM7 9V7h10v2H7z"/></svg>`,
    mortgage: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2L2 7v13h20V7L12 2zm0 2.18L18 8v10H6V8l6-3.82zM11 11h2v6h-2z"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`
  };
  return icons[name] || "";
}

/**
 * renderizarPerfilJugador(jugador, tableroData = null, actualizarUI = null)
 * - Versión actualizada con iconos Font Awesome
 */
export function renderizarPerfilJugador(jugador, tableroData = null, actualizarUI = null) {
  const perfilDiv = document.getElementById("perfil-jugador");
  if (!perfilDiv) return;

  if (!jugador) {
    perfilDiv.innerHTML = "";
    return;
  }

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
            <small style="color:#666;font-weight:700;">— ${props.length}</small>
            <span style="margin-left:auto; opacity:0.7;">${svgIcon("chevron")}</span>
          </summary>
          <ul style="list-style:none;padding-left:0;margin-top:8px;margin-bottom:6px;">${items}</ul>
        </details>
      `;
    }).join("");
  }

  perfilDiv.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center; justify-content:space-between;">
      <div>
        <h2 style="margin:0 0 6px 0; font-size:18px;">${iconoHtml} ${jugador.nombre || "Jugador"}</h2>
        <div style="font-size:13px;color:#444;">
          <span style="display:inline-block;margin-right:12px;"><strong>País:</strong> ${jugador.pais?.toUpperCase() || "??"} ${bandera}</span>
          <span style="display:inline-block;margin-right:12px;"><strong>Posición:</strong> Casilla #${jugador.posicionActual ?? 0}</span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;color:#666;">Dinero</div>
        <div style="font-weight:800; font-size:16px; display:flex; align-items:center; gap:8px; justify-content:flex-end;">
          <span style="display:inline-flex; align-items:center; gap:6px;">${svgIcon("coin")} <span>${formatMoney(jugador.dinero ?? 0)}</span></span>
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
