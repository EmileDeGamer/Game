//#region variables
let background = document.getElementById('background')
let foreground = document.getElementById('foreground')
let hoverground = document.getElementById('hoverground')

let bctx = background.getContext('2d')
let fctx = foreground.getContext('2d')
let hctx = hoverground.getContext('2d')

let foregroundMap = []
let backgroundMap = []
let hovergroundMap = []

let hoveredEntityDisplay = document.getElementById('hoveredEntityDisplay')
let hoverDisplay = document.getElementById('hoverDisplay')
let selectedDisplay = document.getElementById('selectedDisplay')

let pieceSize
let maxX
let maxY
let mapSizeX
let mapSizeY
//#endregion

let button = document.getElementById('createBot')
let selectedObject = {}
let socket = io()

button.onclick = function(){
    socket.emit('createBot', {username:userData['username']})
}

updateStats()

socket.on('connect', function(){
    console.log('connection made!')
    selectedDisplay.innerText = ''
    socket.emit('iAm', {username:userData['username']})
})

socket.on('ownedBots', function(data){
    updateStats(data)
})

socket.on('createMap', function(data){
    maxX = data['maxX']
    maxY = data['maxY']
    mapSizeX = data['maxY']+1
    mapSizeY = data['maxY']+1
    pieceSize = data['pieceSize']
    background.width = mapSizeX*pieceSize
    background.height = mapSizeY*pieceSize
    foreground.width = mapSizeX*pieceSize
    foreground.height = mapSizeY*pieceSize
    hoverground.width = mapSizeX*pieceSize
    hoverground.height = mapSizeY*pieceSize
})

socket.on('errorMessage', function(data){
    alert(data)
})

socket.on('updateMap', function(data){
    if(data['name'] == 'foreground'){
        foregroundMap = data['map']
        fctx.clearRect(0,0, foreground.width, foreground.height)
        for (let i = 0; i < foregroundMap.length; i++) {
            for (let x = 0; x < foregroundMap[i].length; x++) {
                if(typeof foregroundMap[i][x]['color'] != 'undefined'){
                    fctx.fillStyle = foregroundMap[i][x]['color']
                    fctx.fillRect(i*pieceSize,x*pieceSize,pieceSize,pieceSize)
                }
            }
        }
    }
    else if (data['name'] == 'background'){
        backgroundMap = data['map']
        bctx.clearRect(0,0, background.width, background.height)
        for (let i = 0; i < backgroundMap.length; i++) {
            for (let x = 0; x < backgroundMap[i].length; x++) {
                bctx.fillStyle = backgroundMap[i][x]['color']
                bctx.fillRect(i*pieceSize,x*pieceSize,pieceSize,pieceSize)
            }
        }
    }
})

hoverground.onmousedown = function (e) {
    var rect = this.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    i = 0, r;
    let roundedX = Math.floor(x / pieceSize)
    let roundedY = Math.floor(y / pieceSize)
    if(roundedX > maxX){
        roundedX = maxX
    }
    if(roundedY > maxY){
        roundedY = maxY
    }

    //displaying data of selected entity
    if(JSON.stringify(foregroundMap[roundedX][roundedY]) == "{}"){
        selectedDisplay.innerHTML = ''
    }
    else{
        selectedDisplay.innerHTML = ''
        selectedObject = foregroundMap[roundedX][roundedY]
        for (const [key, value] of Object.entries(selectedObject)) {
            selectedDisplay.innerHTML += key + ": " + value + "<br>"
        }
    }
}

hoverground.onmousemove = function (e) {
    var rect = this.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    i = 0, r;
    let roundedX = Math.floor(x / pieceSize)
    let roundedY = Math.floor(y / pieceSize)
    if(roundedX > maxX){
        roundedX = maxX
    }
    if(roundedY > maxY){
        roundedY = maxY
    }
    hoverDisplay.innerHTML = "X: " + roundedX + " Y: " + roundedY

    //the entity select cursor
    hovergroundMap = []
    hovergroundMap.push({x: roundedX, y: roundedY, color: 'yellow'})
    hctx.clearRect(0,0, hoverground.width, hoverground.height)
    for (let z = 0; z < hovergroundMap.length; z++) {
        hctx.fillStyle = hovergroundMap[z]['color']
        hctx.fillRect(hovergroundMap[z]['x']*pieceSize,hovergroundMap[z]['y']*pieceSize,pieceSize,pieceSize)
    }

    //displaying the entity currently hovering over
    if(typeof foregroundMap[roundedX][roundedY]['name'] != 'undefined'){
        hoveredEntityDisplay.innerHTML = foregroundMap[roundedX][roundedY]['name']
    }
    else{
        hoveredEntityDisplay.innerHTML = ''
    }
}

//updating realtime data of selected entity
setInterval(() => {
    if(selectedDisplay.innerText != ''){
        selectedDisplay.innerHTML = ''
        if(JSON.stringify(selectedObject) == "{}"){
            selectedDisplay.innerHTML = ''
        }
        else if(selectedObject['type'] == 'bot'){
            for (let i = 0; i < foregroundMap.length; i++) {
                for (let x = 0; x < foregroundMap[i].length; x++) {
                    if(foregroundMap[i][x]['name'] == selectedObject['name']){
                        for (const [key, value] of Object.entries(foregroundMap[i][x])) {
                            selectedDisplay.innerHTML += key + ": " + value + "<br>"
                        }
                        break
                    }
                }
            }
        }
        else if(selectedObject['type'] != 'bot'){
            for (const [key, value] of Object.entries(foregroundMap[selectedObject['x']][selectedObject['y']])) {
                selectedDisplay.innerHTML += key + ": " + value + "<br>"
            }
        }
    }
}, 1000/10)

function updateStats(ownedBots = []){
    stats.innerHTML = "Stats:<br>"
    for (const [key, value] of Object.entries(userData)) {
        if(key != 'name' && key != 'email'){
            stats.innerHTML += key + ": " + value + "<br>"
        }
    }
    stats.innerHTML += 'Owned Bots: ' + ownedBots.length + "<br>"
}