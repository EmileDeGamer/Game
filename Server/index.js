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
let spawnX = 49, spawnY = 49
let maxX = 99
let maxY = 99
let mapSizeX = maxX + 1
let mapSizeY = maxY + 1
let pieceSize = 10 //in pixels

for (let i = 0; i < mapSizeX; i++) {
    let backgroundRow = []
    let foregroundRow = []
    for (let x = 0; x < mapSizeY; x++) {
        backgroundRow.push({color:'lightblue'})
        foregroundRow.push({})
    }
    background.push(backgroundRow)
    foreground.push(foregroundRow)
}

for (let i = 0; i < 1000; i++) { //testing amount
    let energyGenerator = new EnergyGenerator(Math.floor(Math.random() * maxX), Math.floor(Math.random() * maxY), 'Energy Generator','purple', Math.floor(Math.random() * 5), Math.floor(Math.random() * 100), 0)
    generators.push(energyGenerator)
    foreground[generators[i]['x']][generators[i]['y']] = generators[i]
}

io.on('connection', function(socket){
    console.log('connection made!')  
    socket.emit('createMap', {maxX: maxX, maxY: maxY, pieceSize: pieceSize})
    //#region disconnecting for testing, later bots when they die they will be removed from array
    socket.on('disconnect', function(){
        console.log('disconnected! :(')
        /*if(bots.map(function(e) { return e.socket; }).indexOf(socket) !== -1){
            bots.splice(bots.map(function(e) { return e.socket; }).indexOf(socket), 1)
        }*/
    })
    //#endregion

    //#region update maps
    setInterval(() => {
        socket.emit('updateMap', {map:background, name:'background'})
    }, 1000/10)

    setInterval(() => {
        foreground = []
        for (let i = 0; i < mapSizeX; i++) {
            let foregroundRow = []
            for (let x = 0; x < mapSizeY; x++) {
                foregroundRow.push({})
            }
            foreground.push(foregroundRow)
        }
        for (let i = 0; i < generators.length; i++) {
            foreground[generators[i]['x']][generators[i]['y']] = generators[i]
        }
        for (let x = 0; x < bots.length; x++) {
            foreground[bots[x]['x']][bots[x]['y']] = bots[x]
        }
        io.emit('updateMap', {map:foreground, name:'foreground'})
    }, 1000/10)
    //#endregion
})

function checkOnDuplicateName(data, attempt){
    if(bots.map(function(e) { return e.name; }).indexOf(data) == -1){
        bots.push(new Bot(data, spawnX, spawnY, data))
    }
    else{
        checkOnDuplicateName(data + attempt++, attempt++)
    }
}

for (let i = 0; i < 250; i++) { //testing amount
    bots.push(new Bot('test', spawnX, spawnY, 'test'))
}

for (let x = 0; x < bots.length; x++) {
    moveEntityTowardsTarget(bots[x], generators[Math.floor(Math.random() * generators.length)])
}

//#region pathfinding
function moveEntityTowardsTarget(bot, target){
    let route = findShortestPath(bot, target)
    for (let i = 0; i < route.length-1; i++) {
        setTimeout(function() { 
            if(route[i] == 'north'){
                bot['y']--
                background[bot['x']][bot['y']]['color'] = 'green'
            }
            else if (route[i] == 'east'){
                bot['x']++
                background[bot['x']][bot['y']]['color'] = 'green'
            }
            else if (route[i] == 'south'){
                bot['y']++
                background[bot['x']][bot['y']]['color'] = 'green'
            }
            else if (route[i] == 'west'){
                bot['x']--
                background[bot['x']][bot['y']]['color'] = 'green'
            }
        }, 100 * i) 
    }
}

function translateMapToText(target){
    let grid = []
    for (let i = 0; i < background.length; i++) {
        let row = []
        for (let x = 0; x < background[i].length; x++) {
            row.push('valid')
        }
        grid.push(row)
    }
    for (let i = 0; i < foreground.length; i++) {
        for (let x = 0; x < foreground[i].length; x++) {
            if(foreground[i][x]['type'] == 'generator' || foreground[i][x]['type'] == 'bot'){
                grid[i][x] = 'blocked'
            }
        }
    }
    grid[target['x']][target['y']] = ('goal')
    return grid
}

function findShortestPath(startEntity, target){
    let grid = translateMapToText(target)

    let location = {
        x: startEntity['x'],
        y: startEntity['y'],
        path: [],
        status: 'start'
    }

    let queue = [location]

    while(queue.length > 0){
        let currentLocation = queue.shift()
        let directions = ['north', 'east', 'south', 'west']
        for (let i = 0; i < directions.length; i++) {
            let newLocation = retrieveNeighboursFromDirection(currentLocation, directions[i], grid)
            if(newLocation['status'] == 'goal'){
                grid = []
                return newLocation['path']
            }
            else if(newLocation.status == 'valid'){
                queue.push(newLocation)
            }   
        }
    }

    return false
}

function retrieveNeighboursFromDirection(currentLocation, direction, grid){
    let newPath = currentLocation['path'].slice()
    newPath.push(direction)
    let x = currentLocation['x']
    let y = currentLocation['y']

    if(direction == 'east'){
        x+=1
    }
    else if (direction == 'west'){
        x-=1
    }
    else if (direction == 'south'){
        y+=1
    }
    else if (direction == 'north'){
        y-=1
    }
    
    let newLocation = {
        x: x,
        y: y,
        path: newPath,
        status: 'unknown'
    }
    newLocation['status'] = retrieveLocationStatus(newLocation, grid)

    if(newLocation['status'] === 'valid'){
        background[newLocation['x']][newLocation['y']]['color'] = 'blue'
        grid[newLocation['x']][newLocation['y']] = 'visited'
    }

    return newLocation
}

function retrieveLocationStatus(location, grid){
    if(location['x'] >= mapSizeX || location['x'] < 0 || location['y'] >= mapSizeY || location['y'] < 0){
        return 'invalid'
    }
    else if(grid[location['x']][location['y']] == 'valid'){
        return 'valid'
    }
    else if (grid[location['x']][location['y']] == 'goal'){
        return 'goal'
    }
    else if (grid[location['x']][location['y']] == 'blocked'){
        return 'blocked'
    }
}
//#endregion