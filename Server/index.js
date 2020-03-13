//needs to send the real time view to the client
//initializing things i need
//#region 
let express = require("express")
let app = express()
let http = require('http').createServer(app)
let bodyParser = require('body-parser')
let mysql = require('mysql')
require('dotenv').config()
let io = require('socket.io')(http)

let con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASS,
    database: process.env.DB_DB
})

con.connect(function(err) {
    if (err) console.log('conn failed to DB')
    else if (process.env.DB_DB == ''){
        console.log('conn failed to DB')
    }
    else console.log('connected to DB!')
})

app.set('views','./views')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/', function(req, res){
    res.sendFile('./public/index.html')
})

app.get('*', function(req, res){
    res.send('Sorry, this is an invalid URL.')
})

http.listen(process.env.PORT, function(){
    console.log("listening on " + process.env.PORT)
})

//#endregion

let Bot = require("./classes/BotBase")
let CustomBot = require("./classes/CustomBot-Henk")

let EnergyGenerator = require("./classes/EnergyGeneratorBase")

let background = [], foreground = [], bots = [], generators = []
let coordX = 0, coordY = 0
let spawnX = 49, spawnY = 49
for (let i = 0; i < 100; i++) {
    for (let x = 0; x < 100; x++) {
        background.push({x:coordX,y:coordY,color:"lightblue"})
        coordX++
    }
    coordY++
    coordX=0
}

for (let i = 0; i < 50; i++) {
    let energyGenerator = new EnergyGenerator(Math.floor(Math.random() * 99), Math.floor(Math.random() * 99), 'Energy Generator','purple', Math.floor(Math.random() * 5), Math.floor(Math.random() * 100), 0)
    generators.push(energyGenerator)
}

/*for (let i = 0; i < 100; i++) {
    background[i]['color'] = 'red'
    background[i+9900]['color'] = 'red'
    background[i*100]['color'] = 'red'
    background[i*100+99]['color'] = 'red'
}*/

let colors = ['red', 'orange', 'yellow', 'green', 'lightblue', 'blue', 'purple', 'pink']
let randomIndexOfColor = Math.floor(Math.random() * colors.length)

io.on('connection', function(socket){
    console.log('connection made!')  

    //#region disconnecting for testing, later bots when they die they will be removed from array
    socket.on('disconnect', function(){
        console.log('disconnected! :(')
        if(bots.map(function(e) { return e.socket; }).indexOf(socket) !== -1){
            bots.splice(bots.map(function(e) { return e.socket; }).indexOf(socket), 1)
        }
    })
    //#endregion

    socket.on('createMe', function(data){
        checkOnDuplicateName(data, 0, socket)
        io.emit('updateMap', {map:background,name:'background'})
    })

    /*setInterval(() => {
        for (let i = 0; i < background.length; i++) {
            background[i]['color'] = colors[randomIndexOfColor]
        }
        randomIndexOfColor = Math.floor(Math.random() * colors.length)
        socket.emit('updateMap', {map:background, name:'background'})
    }, 1000)*/

    //movement for testing later automatic by code from clients
    //#region optional
    socket.on('move', function(data){
        for (let i = 0; i < bots.length; i++) {
            if(bots[i]['name'] == data['name']){
                if(data['direction'] == "w"){
                    if(bots[i]['y'] !== 0){
                        bots[i]['y']--
                    }
                }
                else if (data['direction'] == "a"){
                    if(bots[i]['x'] !== 0){
                        bots[i]['x']--
                    }
                }
                else if (data['direction'] == "s"){
                    if(bots[i]['y'] !== 99){
                        bots[i]['y']++
                    }
                }
                else if (data['direction'] == "d"){
                    if(bots[i]['x'] !== 99){
                        bots[i]['x']++
                    }
                }
            }
        }
    })
    //#endregion

    setInterval(() => {
        foreground = []
        for (let i = 0; i < generators.length; i++) {
            foreground.push({x:generators[i]['x'], y:generators[i]['y'], name:generators[i]['name'], color:generators[i]['color'], generationInterval:generators[i]['generationInterval'], maxEnergy:generators[i]['maxEnergy'], currentEnergy:generators[i]['currentEnergy'], type:generators[i]['type']})
        }
        for (let x = 0; x < bots.length; x++) {
            foreground.push({x:bots[x]['x'], y:bots[x]['y'], color:'black', name:bots[x]['name'], owner:bots[x]['owner'], type:bots[x]['type']})
        }
        io.emit('updateMap', {map:foreground, name:'foreground'})
    }, 1000/60)
})

function checkOnDuplicateName(data, attempt, socket){
    if(bots.map(function(e) { return e.name; }).indexOf(data) == -1){
        bots.push(new Bot(data, spawnX, spawnY, data, socket))
        socket.emit('changedNameTo', data)
    }
    else{
        checkOnDuplicateName(data + attempt++, attempt++, socket)
    }
}


setTimeout(() => {
    findPath(bots[0], generators[0])
}, 1000)

bots.push(new Bot('test', spawnX, spawnY, 'test', 'pizza'))
/*function findPath(){
    let thingsToDo = []
    for (let i = 0; i < foreground.length; i++) {
        if(foreground[i]['x'] == generators[0]['x'] && foreground[i]['y'] == generators[0]['y']){
            console.log("X:" + foreground[i]['x'] + " Y:" + foreground[i]['y'])
            let distanceX = foreground[i]['x'] - bots[0]['x']
            let distanceY = foreground[i]['y'] - bots[0]['y']
            if(distanceX > 0){
                //right
                for (let i = 0; i < distanceX; i++) {
                    thingsToDo.push('right')
                }
            }
            else if (distanceX < 0){
                //left
                distanceX = distanceX.toString().replace('-', '')
                for (let i = 0; i < distanceX; i++) {
                    thingsToDo.push('left')
                }
            }
            if(distanceY > 0){
                //down
                for (let i = 0; i < distanceY; i++) {
                    thingsToDo.push('down')
                }
            }
            else if (distanceY < 0){
                //up
                distanceY = distanceY.toString().replace('-', '')
                for (let i = 0; i < distanceY; i++) {
                    thingsToDo.push('up')
                }
            }
            break
        }
    }
    thingsToDo.splice(thingsToDo.length-1, 1)

    for (let i=0; i<thingsToDo.length; i++) { 
        setTimeout(function() { 
            if(thingsToDo[i] == 'left'){
                bots[0]['x']--
            }
            else if (thingsToDo[i] == 'right'){
                bots[0]['x']++
            }
            else if (thingsToDo[i] == 'up'){
                bots[0]['y']--
            }
            else if (thingsToDo[i] == 'down'){
                bots[0]['y']++
            }
        }, 100 * i)
    }
}*/

function findPath(bot, entity){
    let thingsToDo = []
    for (let i = 0; i < foreground.length; i++) {
        if(foreground[i]['x'] == entity['x'] && foreground[i]['y'] == entity['y']){
            console.log("X:" + foreground[i]['x'] + " Y:" + foreground[i]['y'])
            let distanceX = foreground[i]['x'] - bot['x']
            let distanceY = foreground[i]['y'] - bot['y']
            if(distanceX > 0){
                //right
                for (let i = 0; i < distanceX; i++) {
                    thingsToDo.push('right')
                }
            }
            else if (distanceX < 0){
                //left
                distanceX = distanceX.toString().replace('-', '')
                for (let i = 0; i < distanceX; i++) {
                    thingsToDo.push('left')
                }
            }
            if(distanceY > 0){
                //down
                for (let i = 0; i < distanceY; i++) {
                    thingsToDo.push('down')
                }
            }
            else if (distanceY < 0){
                //up
                distanceY = distanceY.toString().replace('-', '')
                for (let i = 0; i < distanceY; i++) {
                    thingsToDo.push('up')
                }
            }
            break
        }
    }
    thingsToDo.splice(thingsToDo.length-1, 1)

    for (let i=0; i<thingsToDo.length; i++) { 
        setTimeout(function() { 
            if(thingsToDo[i] == 'left'){
                bot['x']--
            }
            else if (thingsToDo[i] == 'right'){
                bot['x']++
            }
            else if (thingsToDo[i] == 'up'){
                bot['y']--
            }
            else if (thingsToDo[i] == 'down'){
                bot['y']++
            }
        }, 100 * i)
    }
}