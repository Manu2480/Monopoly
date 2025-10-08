// =============================
//   FIN DEL JUEGO - JS
//   - Hipotecas no suman valor
//   - Propiedades compradas sí cuentan como activos
//   - Resetear datos en localStorage
//   - Envío de resultados al backend (una sola vez)
//   - Normalización de países desde ms-monopoly/database/countries.json
//   - Mostrar SOLO tarjetas y ranking de jugadores activos
// =============================

document.addEventListener("DOMContentLoaded", async () => {
  const log = (...args) => console.log("[fin.js]", ...args);
  const warn = (...args) => console.warn("[fin.js]", ...args);

  // -----------------------------
  // Botones
  // -----------------------------
  const btnNuevo = document.querySelector(".btn-nuevo");
  const btnCerrar = document.querySelector(".btn-cerrar");
  const btnReset = document.querySelector(".btn-reset");

  if (btnNuevo) btnNuevo.addEventListener("click", () => window.location.href = "tablero.html");
  if (btnCerrar) btnCerrar.addEventListener("click", () => window.location.href = "inicio.html");

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      localStorage.removeItem("jugadores_partida");
      localStorage.removeItem("jugadores");
      localStorage.removeItem("resultadosEnviados"); // limpiamos flag
      alert("Datos reseteados. Se recargará la página.");
      location.reload();
    });
  }

  // -----------------------------
  // Contenedores
  // -----------------------------
  const contenedorClasificacion = document.querySelector(".contenedor");
  const tarjetas = [
    document.querySelector("#jugador-1"),
    document.querySelector("#jugador-2"),
    document.querySelector("#jugador-3"),
    document.querySelector("#jugador-4"),
  ];
  console.log("Tarjetas detectadas:", tarjetas);

  // Ocultamos todas las tarjetas al inicio (las mostraremos solo para jugadores activos)
  tarjetas.forEach(card => {
    if (card) card.style.display = "none";
  });

  // -----------------------------
  // Helper para cargar JSON
  // -----------------------------
  async function fetchJsonSafe(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const text = await res.text();
      if (text.trim().startsWith("<")) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // -----------------------------
  // Cargar jugadores
  // -----------------------------
  let jugadores = [];
  try {
    jugadores = JSON.parse(localStorage.getItem("jugadores_partida")) || [];
  } catch {
    jugadores = [];
  }

  if (!jugadores || jugadores.length === 0) {
    jugadores = await fetchJsonSafe("/public/json/jugadores_partida.json") || [];
    if (jugadores.length) {
      localStorage.setItem("jugadores_partida", JSON.stringify(jugadores));
    } else {
      jugadores = await fetchJsonSafe("/public/json/jugadores.json") || [];
    }
  }

  if (!jugadores || jugadores.length === 0) {
    if (contenedorClasificacion) {
      contenedorClasificacion.innerHTML = `
        <h3>Error</h3>
        <p>No se encontraron datos de jugadores.</p>
      `;
    }
    return;
  }

  // -----------------------------
  // Cargar board.json y aplanarlo
  // -----------------------------
  let allCells = [];
  const b = await fetchJsonSafe("/ms-monopoly/database/board.json");
  if (b && typeof b === "object") {
    allCells = [
      ...(b.bottom || []),
      ...(b.left || []),
      ...(b.top || []),
      ...(b.right || []),
    ];
  }

  // -----------------------------
  // Calcular patrimonio
  // -----------------------------
  jugadores.forEach(j => {
    let valorPropiedades = 0;
    let terrenos = 0, ferrocarriles = 0, servicios = 0;
    let casas = 0, hoteles = 0;

    (j.propiedades || []).forEach(p => {
      const propInfo = allCells.find(c => c.id == p.idPropiedad);
      const basePrice = propInfo ? (propInfo.price || 0) : 0;

      if (propInfo && propInfo.type === "property") terrenos++;
      if (propInfo && propInfo.type === "railroad") ferrocarriles++;
      if (propInfo && propInfo.type === "utility") servicios++;

      if (!p.hipotecado) {
        // La propiedad vale su precio de compra
        valorPropiedades += basePrice;

        // Sumar casas y hoteles
        valorPropiedades += (p.casas || 0) * 100;
        valorPropiedades += (p.hotel || 0) * 200;
      }

      casas += p.casas || 0;
      hoteles += p.hotel || 0;
    });

    j.valorPropiedades = valorPropiedades;
    j.terrenos = terrenos;
    j.ferrocarriles = ferrocarriles;
    j.servicios = servicios;
    j.casas = casas;
    j.hoteles = hoteles;
    j.patrimonio = (j.dinero || 0) + valorPropiedades - (j.deudaBanco || 0);
  });

  // -----------------------------
  // Ordenar y mostrar clasificación (solo jugadores activos)
  // -----------------------------
  jugadores.sort((a, b) => b.patrimonio - a.patrimonio);

  if (contenedorClasificacion) {
    contenedorClasificacion.innerHTML = `<h3>Clasificación Final (${jugadores.length} jugador${jugadores.length === 1 ? "" : "es"})</h3>`;
    jugadores.forEach((j, idx) => {
      const fila = document.createElement("div");
      fila.classList.add("fila");
      fila.innerHTML = `
        <span>#${idx + 1}</span>
        <span>${j.nombre || "—"} (${j.pais || "—"})</span>
        <span>💰 $${j.patrimonio}</span>
      `;
      contenedorClasificacion.appendChild(fila);
    });
  }

  // -----------------------------
  // Rellenar tarjetas y mostrar solo las necesarias
  // -----------------------------
  jugadores.forEach((j, idx) => {
    if (idx > 3) return; // límite 4 tarjetas en UI
    const card = tarjetas[idx];
    if (!card) return;
    // mostramos la tarjeta
    card.style.display = "";

    if (card.querySelector(".pais")) card.querySelector(".pais").textContent = j.pais || "";
    if (card.querySelector(".nombre")) card.querySelector(".nombre").textContent = (j.nombre || "—") + " " + (j.ficha || "");
    if (card.querySelector(".dinero-efectivo")) card.querySelector(".dinero-efectivo").textContent = `$${j.dinero || 0}`;
    if (card.querySelector(".valor-propiedades")) card.querySelector(".valor-propiedades").textContent = `$${j.valorPropiedades || 0}`;
    if (card.querySelector(".total")) card.querySelector(".total").textContent = `(${(j.propiedades||[]).length} total)`;
    if (card.querySelector(".terrenos")) card.querySelector(".terrenos").textContent = j.terrenos || 0;
    if (card.querySelector(".ferrocarriles")) card.querySelector(".ferrocarriles").textContent = j.ferrocarriles || 0;
    if (card.querySelector(".servicios")) card.querySelector(".servicios").textContent = j.servicios || 0;
    if (card.querySelector(".casas")) card.querySelector(".casas").textContent = j.casas || 0;
    if (card.querySelector(".hoteles")) card.querySelector(".hoteles").textContent = j.hoteles || 0;
    if (card.querySelector(".patrimonio")) card.querySelector(".patrimonio").textContent = `$${j.patrimonio || 0}`;
  });

  // -----------------------------
  // Guardar snapshot en localStorage
  // -----------------------------
  try {
    localStorage.setItem("jugadores", JSON.stringify(jugadores));
  } catch (e) {
    warn("Error guardando jugadores en localStorage:", e);
  }

  // -----------------------------
  // Cargar countries.json y preparar mapping
  // -----------------------------
  let countryMapping = {};

  async function cargarPaises() {
    try {
      const data = await fetchJsonSafe("/ms-monopoly/database/countries.json");
      if (Array.isArray(data)) {
        data.forEach(obj => {
          const [code, name] = Object.entries(obj)[0];
          countryMapping[name] = code;
        });
        log("Mapping de países cargado:", countryMapping);
      }
    } catch (err) {
      console.error("Error cargando countries.json:", err);
    }
  }

  function normalizarPais(pais) {
    const code = countryMapping[pais] || "xx";
    log(`[fin.js] Mapeo país: ${pais} -> ${code}`);
    return code;
  }

  await cargarPaises();

  // -----------------------------
  // Enviar resultados al backend (una sola vez)
  // -----------------------------
  async function enviarResultados(jugadores) {
    for (const j of jugadores) {
      const payload = {
        nick_name: j.nombre,
        score: j.patrimonio,
        country_code: normalizarPais(j.pais)
      };

      try {
        const res = await fetch("http://127.0.0.1:5000/score-recorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`[fin.js] Resultado enviado para ${j.nombre}:`, data);
      } catch (err) {
        console.error(`[fin.js] Error enviando resultado de ${j.nombre}:`, err);
      }
    }
  }

  // Evitar envíos múltiples
  if (!localStorage.getItem("resultadosEnviados")) {
    enviarResultados(jugadores);
    localStorage.setItem("resultadosEnviados", "true");
    console.log("[fin.js] Resultados enviados al backend.");
  } else {
    console.log("[fin.js] Resultados ya fueron enviados, no se repite.");
  }
});
