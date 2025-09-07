const tablero = document.getElementById("tablero");

// Recorremos las 11 filas x 11 columnas
for (let row = 0; row < 11; row++) {
  for (let col = 0; col < 11; col++) {
    const div = document.createElement("div");

    // Centro vacío (9x9)
    if (row > 0 && row < 10 && col > 0 && col < 10) {
      if (row === 5 && col === 5) {
        div.className =
          "bg-white flex items-center justify-center text-black font-bold text-lg col-span-1 row-span-1";
        div.innerText = "MONOPOLY";
      } else {
        div.className = "bg-gray-100"; // relleno vacío
      }
    } else {
      // Borde → aquí van las casillas numeradas
      div.className = "casilla";
      div.innerText = getCasillaNumber(row, col);
    }

    tablero.appendChild(div);
  }
}

// Función que asigna el número correcto de casilla en el borde
function getCasillaNumber(row, col) {
  // Arriba (0, de izq a der)
  if (row === 0) return col;
  // Derecha (de arriba a abajo)
  if (col === 10) return 10 + row;
  // Abajo (de der a izq)
  if (row === 10) return 30 + (10 - col);
  // Izquierda (de abajo a arriba)
  if (col === 0) return 20 + (10 - row);
}
