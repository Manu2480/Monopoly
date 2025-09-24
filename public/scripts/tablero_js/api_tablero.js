// ======================== API ========================
export async function cargarTablero(tableroData) {
    try {
        const res = await fetch("http://127.0.0.1:5000/board");
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        const boardData = await res.json();

        tableroData.community_chest = boardData.community_chest || [];
        tableroData.chance = boardData.chance || [];

        const mapa = new Map();
        const secciones = ['bottom', 'left', 'top', 'right'];
        secciones.forEach(sec => {
            (boardData[sec] || []).forEach(item => {
                if (typeof item.id === 'number') mapa.set(item.id, item);
            });
        });

        tableroData.casillas = [];
        for (let i = 0; i < 40; i++) {
            if (!mapa.has(i)) throw new Error(`Falta casilla con id ${i}`);
            tableroData.casillas.push(mapa.get(i));
        }
    } catch (error) {
        console.error("Error cargando tablero:", error);
        throw error;
    }
}

export async function cargarJugadores() {
    try {
        const res = await fetch("json/jugadores.json");
        if (!res.ok) throw new Error("No se pudo cargar json/jugadores.json");
        return await res.json();
    } catch (error) {
        console.error("Error cargando jugadores:", error);
        return [];
    }
}
