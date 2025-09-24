export function voltearCarta(tipo, tableroData) {
    let mazo = document.getElementById("panel-casilla");
    let cartas = tipo === "suerte" ? tableroData.chance : tableroData.community_chest;

    if (!cartas || cartas.length === 0) {
        mazo.textContent = "No hay cartas";
        return;
    }

    mazo.style.transform = 'rotateY(90deg)';
    mazo.style.transition = 'transform 0.3s ease';

    setTimeout(() => {
        let carta = cartas[Math.floor(Math.random() * cartas.length)];
        mazo.innerHTML = `<div class="texto">${carta.description || carta.text || ""}</div>`;
        mazo.style.transform = 'rotateY(0deg)';
    }, 300);
}
