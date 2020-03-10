let bord = document.getElementById('bord')
bord.style.gridTemplateColumns = "repeat(100, 15px)"
bord.style.gridTemplateRows = "repeat(100, 15px)"

let coordX = 0, coordY = 0

for (let i = 0; i < 100; i++) {
    for (let x = 0; x < 100; x++) {
        let button = document.createElement('span')
        button.style.backgroundColor = "white"
        button.innerHTML = coordX + ":" + coordY
        button.style.color = button.style.backgroundColor
        bord.appendChild(button)
        coordX++;
    }
    coordY++;
    coordX = 0;
}

console.log(coordX + ":" + coordY)
