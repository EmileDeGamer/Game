let botname = prompt('Tell me your bot name', 'bot name')

let socket = io()

socket.on('connect', function(){
    console.log('connection made!')
})

socket.on('updateMap', function(data){
    if(data['name'] == 'foreground'){
        foregroundMap = data['map']
        fctx.clearRect(0,0, foreground.width, foreground.height)
        for (let i = 0; i < data['map'].length; i++) {
            fctx.fillStyle = data['map'][i]['color']
            fctx.fillRect(data['map'][i]['x']*10,data['map'][i]['y']*10,10,10)
        }
    }
    else if (data['name'] == 'background'){
        backgroundMap = data['map']
        bctx.clearRect(0,0, background.width, background.height)
        for (let i = 0; i < data['map'].length; i++) {
            bctx.fillStyle = data['map'][i]['color']
            bctx.fillRect(data['map'][i]['x']*10,data['map'][i]['y']*10,10,10)
        }
    }
})

socket.on('changedNameTo', function(data){
    botname = data
})

socket.emit('createMe', botname)

let background = document.getElementById('layer1')
let foreground = document.getElementById('layer2')
let hoverground = document.getElementById('layer3')
let bctx = background.getContext('2d')
let fctx = foreground.getContext('2d')
let hctx = hoverground.getContext('2d')

let foregroundMap = []
let backgroundMap = []
let hovergroundMap = []

let hoveredEntityDisplay = document.getElementById('hoveredEntityDisplay')

init()

function init () {
    let mapSize = 100
    let pieceSize = 10 //in pixels
    background.width = mapSize*pieceSize
    background.height = mapSize*pieceSize
    foreground.width = mapSize*pieceSize
    foreground.height = mapSize*pieceSize
    hoverground.width = mapSize*pieceSize
    hoverground.height = mapSize*pieceSize
}

let buttons = [document.getElementById('w'), document.getElementById('a'), document.getElementById('s'), document.getElementById('d')]

for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function(){socket.emit('move', {direction:buttons[i].innerHTML,name:botname})}
}

//console.log(getMousePos(foreground, event))

hoverground.onmousemove = function (e) {
    var rect = this.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    i = 0, r;
    let roundedX = Math.floor(x / 10)
    let roundedY = Math.floor(y / 10)
    for (let i = 0; i < backgroundMap.length; i++) {
        if(typeof foregroundMap[i] !== 'undefined'){
            if(foregroundMap[i]['x'] == roundedX && foregroundMap[i]['y'] == roundedY){
                console.log(foregroundMap[i])
                hoveredEntityDisplay.innerHTML = JSON.stringify(foregroundMap[i])
            }
            else{
                hoveredEntityDisplay.innerHTML = ''
            }
        }
        if(backgroundMap[i]['x'] == roundedX && backgroundMap[i]['y'] == roundedY){
            hovergroundMap = []
            hovergroundMap.push({x: backgroundMap[i]['x'], y: backgroundMap[i]['y'], color: 'yellow'})
            hctx.clearRect(0,0, hoverground.width, hoverground.height)
            for (let z = 0; z < hovergroundMap.length; z++) {
                hctx.fillStyle = hovergroundMap[z]['color']
                hctx.fillRect(hovergroundMap[z]['x']*10,hovergroundMap[z]['y']*10,10,10)
            }
        }
    }  
}

/*function showCoords(event) {
    var x = event.;
    var y = event.clientY;
    var coords = "X coords: " + x + ", Y coords: " + y;
    console.log(coords)
  }*/