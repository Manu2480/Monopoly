import { moverJugador } from "./jugadores_tablero.js";
import { mostrarResultadoDados } from "./ui_tablero.js";

export function tirarDados(jugadores, indiceTurno, tableroData, casillasVisibles, calcularRangoVisible, puedeTirar, setPuedeTirar, setHaMovido) {
    if (!puedeTirar) {
        alert("Ya tiraste los dados.");
        return;
    }

    const dado1 = document.getElementById("dado1");
    const dado2 = document.getElementById("dado2");
    if (!dado1 || !dado2) return;

    const resultado1 = getCara();
    const resultado2 = getCara();
    dado1.textContent = resultado1;
    dado2.textContent = resultado2;

    const suma = obtenerValorDado(resultado1) + obtenerValorDado(resultado2);
    mostrarResultadoDados(suma);

    if (jugadores.length > 0) {
        moverJugador(jugadores[indiceTurno].id, suma, jugadores, tableroData, casillasVisibles, calcularRangoVisible);
    }

    setHaMovido(true);
    setPuedeTirar(suma % 2 === 0);
}

function getCara() {
    const caras = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return caras[Math.floor(Math.random() * 6)];
}

function obtenerValorDado(cara) {
    const valores = { "⚀": 1, "⚁": 2, "⚂": 3, "⚃": 4, "⚄": 5, "⚅": 6 };
    return valores[cara] || 1;
}
