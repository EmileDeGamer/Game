let botname = prompt('Tell me your bot name', 'bot name')

let socket = io()

socket.on('connect', function(){
    console.log('connection made!')
})

socket.on('updateMap', function(data){
    if(data['name'] == 'foreground'){
        fctx.clearRect(0,0, foreground.width, foreground.height)
        for (let i = 0; i < data['map'].length; i++) {
            fctx.fillStyle = data['map'][i]['color']
            fctx.fillRect(data['map'][i]['x']*10,data['map'][i]['y']*10,10,10)
        }
    }
    else if (data['name'] == 'background'){
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
let bctx = background.getContext('2d')
let fctx = foreground.getContext('2d')

init()

function init () {
    let mapSize = 100
    let pieceSize = 10 //in pixels
    background.width = mapSize*pieceSize
    background.height = mapSize*pieceSize
    foreground.width = mapSize*pieceSize
    foreground.height = mapSize*pieceSize
}

let buttons = [document.getElementById('w'), document.getElementById('a'), document.getElementById('s'), document.getElementById('d')]

for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function(){socket.emit('move', {direction:buttons[i].innerHTML,name:botname})}
}