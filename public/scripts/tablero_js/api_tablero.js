// ======================== API ========================
export async function cargarTablero(tableroData) {
  try {
    const res = await fetch("http://127.0.0.1:5000/board");
    if (!res.ok) throw new Error(`Error API: ${res.status}`);
    const boardData = await res.json();

    // Guardar cartas
    tableroData.community_chest = boardData.community_chest || [];
    tableroData.chance = boardData.chance || [];

    // Mapear casillas por id
    const mapa = new Map();
    const secciones = ["bottom", "left", "top", "right"];
    secciones.forEach(sec => {
      (boardData[sec] || []).forEach(item => {
        if (typeof item.id === "number") mapa.set(item.id, item);
      });
    });

    // Reconstruir el array de 40 casillas en orden
    tableroData.casillas = [];
    for (let i = 0; i < 40; i++) {
      if (!mapa.has(i)) {
        console.warn(`⚠️ Falta casilla con id ${i}, usando placeholder.`);
        tableroData.casillas.push({ id: i, name: `Casilla ${i}`, type: "generic" });
      } else {
        tableroData.casillas.push(mapa.get(i));
      }
    }
  } catch (error) {
    console.error("❌ Error cargando tablero:", error);
    // fallback: tablero vacío
    tableroData.casillas = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      name: `Casilla ${i}`,
      type: "generic"
    }));
    tableroData.community_chest = [];
    tableroData.chance = [];
  }
}


//Cargar jugadores desde el local storage --> console.table(JSON.parse(localStorage.getItem("monopoly_jugadores")));
export async function cargarJugadores() {
  try {
    // 👇 Primero intenta leer desde LocalStorage
    const local = localStorage.getItem("monopoly_jugadores");
    if (local) {
      return JSON.parse(local);
    }

    // Si no hay nada en LocalStorage, carga el JSON como fallback
    const res = await fetch("json/jugadores.json");
    if (!res.ok) throw new Error("No se pudo cargar json/jugadores.json");
    return await res.json();
  } catch (error) {
    console.error("❌ Error cargando jugadores:", error);
    return [
      { id: 1, nombre: "Jugador 1", dinero: 1500, posicionActual: 0, color: "#1D1D1D", turno: true }
    ];
  }
}

