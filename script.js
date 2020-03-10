let bord = document.getElementById('bord')
bord.style.gridTemplateColumns = "repeat(100, 5px)"
bord.style.gridTemplateRows = "repeat(100, 5px)"

let coordX = 0, coordY = 0

for (let i = 0; i < 100; i++) {
    for (let x = 0; x < 100; x++) {
        let sqaure = document.createElement('span')
        sqaure.style.backgroundColor = "white"
        sqaure.innerHTML = coordX + ":" + coordY
        bord.appendChild(sqaure)
        coordX++;
    }
    coordY++;
    coordX = 0;
}

function changeMapOnPos(color, pos){
    for (let i = 0; i < bord.childNodes.length; i++) {
        if(bord.childNodes[i].innerHTML == pos){
            if(bord.childNodes[i].style.backgroundColor !== color){
                bord.childNodes[i].style.backgroundColor = color
            }
            break
        }
    }
}

changeMapOnPos("red", "0:0")
changeMapOnPos("red", "99:99")
changeMapOnPos("red", "0:99")
changeMapOnPos("red", "99:0")

//Testing for chaning map
let colors = ["red", "orange", "yellow", "green", "lightblue", "blue", "purple", "pink"]

let randomIndex = Math.floor(Math.random() * colors.length)

setInterval(() => {
    for (let i = 0; i < 100; i++) {
        changeMapOnPos(colors[randomIndex], i + ":0")
        changeMapOnPos(colors[randomIndex], i + ":99")
        changeMapOnPos(colors[randomIndex], "0:" + i)
        changeMapOnPos(colors[randomIndex], "99:" + i)
    }
    randomIndex = Math.floor(Math.random() * colors.length)
}, 1000);