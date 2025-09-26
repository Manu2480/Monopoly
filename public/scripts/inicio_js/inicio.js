// scripts/script.js
(async function () {


 async function cargarPaises() {
  try {
    const res = await fetch("http://127.0.0.1:5000/countries");
    if (!res.ok) throw new Error("Error al cargar países");
    return await res.json();
    
  } catch (err) {
    console.error("Error en countryService:", err);
    return[];
}
}

async function getCountry() {
  try {
    const coi = await cargarPaises();
    coi.forEach(country => {
      const [code,name] = Object.entries(country)[0];
      console.log(`Código: ${code}, Nombre: ${name}`);
    });
      
  } catch (error) {
    console.error("Error al obtener países:", error);
  }
}

getCountry();

async function mostrarPaisesEnSelect() {
  try {
    const selectPaises = document.getElementById('country'); // Asumiendo que el select tiene id="country"
    const paises = await cargarPaises();
    
    // Limpiar opciones existentes
    selectPaises.innerHTML = '';
    
    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona un país';
    selectPaises.appendChild(defaultOption);
    
    // Agregar países al select
    paises.forEach(country => {
      const [code, name] = Object.entries(country)[0];
      const option = document.createElement('option');
      option.value = code.toLowerCase(); // El código en minúsculas para las banderas
      option.textContent = name;
      selectPaises.appendChild(option);
    });
      
  } catch (error) {
    console.error("Error al cargar países:", error);
  }
}
document.addEventListener('DOMContentLoaded', mostrarPaisesEnSelect);

// ...existing code...

    // ===================== INICIO =====================
    document.addEventListener("DOMContentLoaded", async () => {

      // Inputs y botones
      const nombreInput = document.getElementById("nombre");
      const countryInput = document.getElementById("country");
      const fichas = Array.from(document.querySelectorAll(".ficha, .fucha"));
      const colores = Array.from(document.querySelectorAll(".color, .circulo"));
      const btnAgregar = document.getElementById("agregar");
      const tablaJugadores = document.getElementById("tabla-jugadores");
      const btnIniciar = document.querySelector(".btnIniciar");
      const mensajeDiv = document.querySelector(".mostrarError");

      let fichaSeleccionada = null;
      let colorSeleccionado = null;
      let jugadores = [];
      let jugadorEditando = null;

      // ===================== COLORES =====================
      colores.forEach((c) => {
        if (!c.dataset.color) {
          const cls = Array.from(c.classList).find(cl => cl !== "color" && cl !== "circulo");
          c.dataset.color = cls || "";
        }
      });

      // ===================== ERRORES =====================
      function mostrarError(elemento, mensaje) {
        if (!elemento) return;
        let div = elemento.parentElement.querySelector(".error-msg");
        if (!div) {
          div = document.createElement("div");
          div.className = "error-msg";
          div.style.color = "#c0392b";
          div.style.marginTop = "6px";
          div.style.fontSize = "0.9rem";
          elemento.parentElement.appendChild(div);
        }
        div.textContent = mensaje;
      }

      function limpiarError(elemento) {
        if (!elemento) return;
        const div = elemento.parentElement.querySelector(".error-msg");
        if (div) div.remove();
      }

      // ===================== OBTENER PAÍS =====================
      function obtenerNombrePais() {
        return countryInput.value ? countryInput.value.trim() : "";
      }

      // ===================== RENDER TABLA =====================
      function renderTabla() {
        tablaJugadores.innerHTML = "";
        jugadores.forEach(j => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
          <td>
            <img src="https://flagcdn.com/24x18/${j.pais}.png" alt="${j.pais}" style="vertical-align:middle; margin-right:5px;">
            ${escapeHtml(j.pais)}
          </td>
          <td>${escapeHtml(j.nombre)}</td>
          <td style="font-size:1.4rem">${escapeHtml(j.ficha)}</td>
          <td><button class="color ${escapeHtml(j.color)}" disabled data-color="${escapeHtml(j.color)}"></button></td>
          <td>
            <button class="btn btn-warning btn-sm btn-actualizar">Actualizar</button>
            <button class="btn btn-danger btn-sm btn-eliminar">Eliminar</button>
          </td>
        `;

          // Eliminar jugador
          fila.querySelector(".btn-eliminar").addEventListener("click", () => {
            if (!confirm(`¿Eliminar a ${j.nombre}?`)) return;
            jugadores = jugadores.filter(x => x.id !== j.id);
            guardarJugadoresLocal();
            renderTabla();
          });

          // Actualizar jugador
          fila.querySelector(".btn-actualizar").addEventListener("click", () => {
            jugadorEditando = j;
            nombreInput.value = j.nombre;
            countryInput.value = j.pais;
            fichas.forEach(f => { f.classList.remove("active"); if (f.textContent.trim() === j.ficha) { f.classList.add("active"); fichaSeleccionada = j.ficha; } });
            colores.forEach(c => { c.classList.remove("active"); if (c.dataset.color === j.color) { c.classList.add("active"); colorSeleccionado = j.color; } });
            btnAgregar.textContent = "Actualizar Jugador";
          });

          tablaJugadores.appendChild(fila);
        });
      }

      function escapeHtml(text) {
        if (!text && text !== 0) return "";
        return String(text)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // ===================== LOCALSTORAGE =====================
      function guardarJugadoresLocal() {
        localStorage.setItem('monopoly_jugadores', JSON.stringify(jugadores));
      }

      function cargarJugadoresLocal() {
        const jugadoresGuardados = localStorage.getItem('monopoly_jugadores');
        if (jugadoresGuardados) jugadores = JSON.parse(jugadoresGuardados);
        renderTabla();
      }

      // ===================== SELECCIÓN FICHAS =====================
      fichas.forEach(btn => {
        btn.addEventListener("click", () => {
          fichas.forEach(f => f.classList.remove("active"));
          btn.classList.add("active");
          fichaSeleccionada = btn.textContent.trim();
          limpiarError(btn);
        });
      });

      // ===================== SELECCIÓN COLORES =====================
      colores.forEach(btn => {
        btn.addEventListener("click", () => {
          colores.forEach(c => c.classList.remove("active"));
          btn.classList.add("active");
          colorSeleccionado = btn.dataset.color;
          limpiarError(btn);
        });
      });

      // ===================== AGREGAR / ACTUALIZAR =====================
      btnAgregar && btnAgregar.addEventListener("click", () => {
        const nombre = nombreInput.value.trim();
        const pais = obtenerNombrePais();

        let valido = true;
        if (!nombre) { mostrarError(nombreInput, "⚠️ Ingresa un nombre"); valido = false; } else limpiarError(nombreInput);
        if (!pais) { mostrarError(countryInput, "⚠️ Selecciona un país"); valido = false; } else limpiarError(countryInput);
        if (!fichaSeleccionada) { mostrarError(fichas[0], "⚠️ Debes elegir una ficha"); valido = false; } else limpiarError(fichas[0]);
        if (!colorSeleccionado) { mostrarError(colores[0], "⚠️ Debes elegir un color"); valido = false; } else limpiarError(colores[0]);
        if (!valido) return;

        const otros = jugadorEditando ? jugadores.filter(j => j.id !== jugadorEditando.id) : jugadores;
        if (otros.some(j => j.nombre === nombre)) return alert("❌ Ese nombre ya fue usado");
        if (otros.some(j => j.ficha === fichaSeleccionada)) return alert("❌ Esa ficha ya fue elegida");
        if (otros.some(j => j.color === colorSeleccionado)) return alert("❌ Ese color ya fue elegido");

        const nuevoJugador = {
          id: jugadorEditando ? jugadorEditando.id : Date.now(),
          nombre,
          pais,
          ficha: fichaSeleccionada,
          color: colorSeleccionado,
          dinero: jugadorEditando ? jugadorEditando.dinero : 1500,
          deudaBanco: jugadorEditando ? jugadorEditando.deudaBanco : 0,
          propiedades: jugadorEditando ? jugadorEditando.propiedades || [] : [],
          posicionActual: jugadorEditando ? jugadorEditando.posicionActual : 0,
          turno: jugadorEditando ? jugadorEditando.turno || false : false
        };

        if (jugadorEditando) {
          jugadores = jugadores.map(j => j.id === nuevoJugador.id ? nuevoJugador : j);
          jugadorEditando = null;
          btnAgregar.textContent = "Agregar Jugador";
        } else {
          jugadores.push(nuevoJugador);
        }

        // Reset UI
        nombreInput.value = "";
        countryInput.value = "";
        fichaSeleccionada = null;
        colorSeleccionado = null;
        fichas.forEach(f => f.classList.remove("active"));
        colores.forEach(c => c.classList.remove("active"));

        guardarJugadoresLocal();
        renderTabla();
      });

      // ===================== INICIAR JUEGO =====================
      btnIniciar && btnIniciar.addEventListener("click", () => {
        mensajeDiv.innerHTML = ""; mensajeDiv.className = "mostrarError";

        if (jugadores.length < 2) { mensajeDiv.innerHTML = "⚠️ Se necesitan mínimo 2 jugadores."; mensajeDiv.classList.add("error"); }
        else if (jugadores.length > 4) { mensajeDiv.innerHTML = "⚠️ Máximo 4 jugadores."; mensajeDiv.classList.add("error"); }
        else { mensajeDiv.innerHTML = `🎉 Juego iniciado con ${jugadores.length} jugador(es)!`; mensajeDiv.classList.add("exito"); }

        setTimeout(() => { mensajeDiv.innerHTML = ""; mensajeDiv.className = "mostrarError"; }, 3000);
      });

      // ===================== INICIALIZAR =====================
      
      cargarJugadoresLocal(); // carga jugadores desde localStorage
    });

  }) ();
