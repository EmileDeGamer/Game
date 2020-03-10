let bord = document.getElementById('bord')
bord.style.gridTemplateColumns = "repeat(192, 10px)"
bord.style.gridTemplateRows = "repeat(54, 20px)"
for (let i = 0; i <= 10367; i++) {
    let button = document.createElement('span')
    button.innerHTML = "0"
    bord.appendChild(button)
}