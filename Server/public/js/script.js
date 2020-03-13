//must be removed after user can code bots
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

//#region must be removed after user can code bots
socket.on('changedNameTo', function(data){
    botname = data
})

socket.emit('createMe', botname)
//#endregion

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

let pieceSize = 10 //in pixels
let maxX = 99
let maxY = 99
let mapSizeX = maxX + 1
let mapSizeY = maxY + 1
//#endregion

init()

function init () {
    background.width = mapSizeX*pieceSize
    background.height = mapSizeY*pieceSize
    foreground.width = mapSizeX*pieceSize
    foreground.height = mapSizeY*pieceSize
    hoverground.width = mapSizeX*pieceSize
    hoverground.height = mapSizeY*pieceSize
}

//#region must be removed after user can code bots
let buttons = [document.getElementById('w'), document.getElementById('a'), document.getElementById('s'), document.getElementById('d')]

for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function(){socket.emit('move', {direction:buttons[i].innerHTML,name:botname})}
}
//#endregion

hoverground.onmousedown = function (e) {
    var rect = this.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    i = 0, r;
    let roundedX = Math.floor(x / 10)
    let roundedY = Math.floor(y / 10)
    if(roundedX > maxX){
        roundedX = maxX
    }
    if(roundedY > maxY){
        roundedY = maxY
    }

    //displaying data of selected entity
    for (let i = 0; i < foregroundMap.length; i++) {
        if(typeof foregroundMap[i] !== 'undefined'){
            if(foregroundMap[i]['x'] == roundedX && foregroundMap[i]['y'] == roundedY){
                selectedDisplay.innerHTML = JSON.stringify(foregroundMap[i])
                break
            }
            else{
                selectedDisplay.innerHTML = ''
            }
        }
    }
}

hoverground.onmousemove = function (e) {
    var rect = this.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top,
    i = 0, r;
    let roundedX = Math.floor(x / 10)
    let roundedY = Math.floor(y / 10)
    if(roundedX > maxX){
        roundedX = maxX
    }
    if(roundedY > maxY){
        roundedY = maxY
    }
    hoverDisplay.innerHTML = "X: " + roundedX + " Y: " + roundedY

    //the entity select cursor
    for (let i = 0; i < backgroundMap.length; i++) {
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

    //displaying the entity currently hovering over
    for (let i = 0; i < foregroundMap.length; i++) {
        if(typeof foregroundMap[i] !== 'undefined'){
            if(foregroundMap[i]['x'] == roundedX && foregroundMap[i]['y'] == roundedY){
                hoveredEntityDisplay.innerHTML = foregroundMap[i]['name']
                break
            }
            else{
                hoveredEntityDisplay.innerHTML = ''
            }
        }
    }
}

//updating realtime data of selected entity
setInterval(() => {
    let selectedDisplayText = selectedDisplay.innerText
    if(selectedDisplayText != ''){
        let object = JSON.parse(selectedDisplayText)
        if(object['type'] == 'bot'){
            for (let i = 0; i < foregroundMap.length; i++) {
                if(foregroundMap[i]['name'] == object['name']){
                    selectedDisplay.innerHTML = JSON.stringify(foregroundMap[i])
                    break
                }
            }
        }
        else{
            for (let i = 0; i < foregroundMap.length; i++) {
                if(foregroundMap[i]['x'] == object['x'] && foregroundMap[i]['y'] == object['y']){
                    selectedDisplay.innerHTML = JSON.stringify(foregroundMap[i])
                    break
                }
            }
        }
    }
}, 1000/60)