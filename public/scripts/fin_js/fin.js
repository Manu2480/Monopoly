// =============================
//   FIN DEL JUEGO - JS
// =============================

// Cuando el documento esté listo
document.addEventListener("DOMContentLoaded", async () => {
    // Contenedores
    const contenedorClasificacion = document.querySelector(".contenedor");
    const tarjetas = [
      document.getElementById("jugador-1"),
      document.getElementById("jugador-2"),
      document.getElementById("jugador-3"),
      document.getElementById("jugador-4"),
    ];
  
    // Cargar jugadores desde localStorage
    let jugadores = JSON.parse(localStorage.getItem("jugadores_partida")) || [];
    if (jugadores.length === 0) {
      console.warn("⚠️ No se encontraron jugadores en localStorage.");
      return;
    }
  
    // Cargar board.json para precios/hipotecas
    let board = [];
    try {
        const res = await fetch("../database/board.json");
      board = await res.json();
    } catch (error) {
      console.error("Error cargando board.json:", error);
    }
  
    // =============================
    //  Calcular patrimonio
    // =============================
    jugadores.forEach(j => {
      let valorPropiedades = 0;
      let terrenos = 0, ferrocarriles = 0, servicios = 0;
      let casas = 0, hoteles = 0;
  
      j.propiedades.forEach(p => {
        const propInfo = board.find(b => b.id === p.idPropiedad);
        if (!propInfo) return;
  
        // Tipo de propiedad
        if (propInfo.type === "property") terrenos++;
        if (propInfo.type === "railroad") ferrocarriles++;
        if (propInfo.type === "utility") servicios++;
  
        // Valor propiedad (si no está hipotecada)
        if (!p.hipotecado) {
          valorPropiedades += propInfo.price;
        } else {
          valorPropiedades -= propInfo.mortgage || 0;
        }
  
        // Construcciones
        casas += p.casas || 0;
        hoteles += p.hotel || 0;
        valorPropiedades += (p.casas || 0) * 100;
        valorPropiedades += (p.hotel || 0) * 200;
      });
  
      // Guardar resultados en el jugador
      j.valorPropiedades = valorPropiedades;
      j.terrenos = terrenos;
      j.ferrocarriles = ferrocarriles;
      j.servicios = servicios;
      j.casas = casas;
      j.hoteles = hoteles;
  
      // Patrimonio total
      j.patrimonio = j.dinero + valorPropiedades - (j.deudaBanco || 0);
    });
  
    // =============================
    //  Ordenar por patrimonio
    // =============================
    jugadores.sort((a, b) => b.patrimonio - a.patrimonio);
  
    // =============================
    //  Mostrar clasificación
    // =============================
    contenedorClasificacion.innerHTML = "<h3>Clasificación Final</h3>";
    jugadores.forEach((j, idx) => {
      const fila = document.createElement("div");
      fila.classList.add("fila");
      fila.innerHTML = `
        <span>#${idx + 1}</span>
        <span>${j.nombre} (${j.pais})</span>
        <span>💰 $${j.patrimonio}</span>
      `;
      contenedorClasificacion.appendChild(fila);
    });
  
    // Si hay menos de 4 jugadores, completar vacíos
    for (let i = jugadores.length; i < 4; i++) {
      const fila = document.createElement("div");
      fila.classList.add("fila");
      fila.innerHTML = `<span>#${i + 1}</span><span>-</span><span>-</span>`;
      contenedorClasificacion.appendChild(fila);
    }
  
    // =============================
    //  Rellenar tarjetas
    // =============================
    jugadores.forEach((j, idx) => {
      if (idx > 3) return; // máximo 4
      const card = tarjetas[idx];
      card.querySelector(".pais").textContent = j.pais;
      card.querySelector(".nombre").textContent = j.nombre + " " + j.ficha;
      card.querySelector(".dinero-efectivo").textContent = `$${j.dinero}`;
      card.querySelector(".valor-propiedades").textContent = `$${j.valorPropiedades}`;
      card.querySelector(".total").textContent = `(${j.propiedades.length} total)`;
      card.querySelector(".terrenos").textContent = j.terrenos;
      card.querySelector(".ferrocarriles").textContent = j.ferrocarriles;
      card.querySelector(".servicios").textContent = j.servicios;
      card.querySelector(".casas").textContent = j.casas;
      card.querySelector(".hoteles").textContent = j.hoteles;
      card.querySelector(".patrimonio").textContent = `$${j.patrimonio}`;
    });
  
    // Las tarjetas sobrantes quedan en blanco
    for (let i = jugadores.length; i < 4; i++) {
      const card = tarjetas[i];
      if (!card) continue;
      card.querySelector(".pais").textContent = "";
      card.querySelector(".nombre").textContent = "—";
      card.querySelector(".dinero-efectivo").textContent = "$0";
      card.querySelector(".valor-propiedades").textContent = "$0";
      card.querySelector(".total").textContent = "(0 total)";
      card.querySelector(".terrenos").textContent = "0";
      card.querySelector(".ferrocarriles").textContent = "0";
      card.querySelector(".servicios").textContent = "0";
      card.querySelector(".casas").textContent = "0";
      card.querySelector(".hoteles").textContent = "0";
      card.querySelector(".patrimonio").textContent = "$0";
    }
  
    // =============================
    //  Guardar en jugadores.json (simulado con localStorage)
    // =============================
    localStorage.setItem("jugadores", JSON.stringify(jugadores));
  
    // =============================
    //  Botones
    // =============================
    document.querySelector(".btn-nuevo").addEventListener("click", () => {
      window.location.href = "tablero.html";
    });
  
    document.querySelector(".btn-cerrar").addEventListener("click", () => {
      window.location.href = "inico.html";
    });
  });
  