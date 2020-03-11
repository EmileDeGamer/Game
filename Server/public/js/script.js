/*let bord = document.getElementById('bord')
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
            if(bord.childNodes[i].style.backgroundColor != color){
                bord.childNodes[i].style.backgroundColor = color
            }
            break
        }
    }
}
/*
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
*/
let botname = prompt('Tell me your bot name', 'bot name')

let socket = io()

socket.on('connect', function(){
    console.log('connection made!')
})

socket.on('updateMap', function(data){
    if(data['name'] == 'foreground'){
        fctx.clearRect(0,0, foreground.width, foreground.height)
        for (let i = 0; i < data['map'].length; i++) {
            if(data['map'][i]['color'] != null){
                fctx.fillStyle = data['map'][i]['color']
                fctx.fillRect(data['map'][i]['x']*10,data['map'][i]['y']*10,10,10)
            }
        }
    }
    else if (data['name'] == 'background'){
        bctx.clearRect(0,0, background.width, background.height)
        for (let i = 0; i < data['map'].length; i++) {
            if(data['map'][i]['color'] != null){
                bctx.fillStyle = data['map'][i]['color']
                bctx.fillRect(data['map'][i]['x']*10,data['map'][i]['y']*10,10,10)
            }
        }
    }
})

socket.on('changedNameTo', function(data){
    botname = data
})

socket.emit('createMe', botname)

let background = document.getElementById('layer1')
let foreground = document.getElementById('layer2')
let bctx = background.getContext('2d')
let fctx = foreground.getContext('2d')

init()

function init () {
    background.width = 100*10
    background.height = 100*10
    foreground.width = 100*10
    foreground.height = 100*10
}

let buttons = [document.getElementById('w'), document.getElementById('a'), document.getElementById('s'), document.getElementById('d')]

for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function(){socket.emit('move', {direction:buttons[i].innerHTML,name:botname})}
}