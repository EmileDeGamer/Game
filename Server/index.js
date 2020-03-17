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
let maxX = 99
let maxY = 99
let mapSizeX = maxX + 1
let mapSizeY = maxY + 1
let spawnX = Math.floor(mapSizeX / 2), spawnY = Math.floor(mapSizeY / 2)
let pieceSize = 10 //in pixels

let d1 = new Date()
let d2 = new Date()
console.log("Generating foreground and background...")
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
console.log("Generating foreground and background took " + (d2.getTime() - d1.getTime()) + " ms")
console.log("Generating energy generators...")
d1 = new Date()
for (let i = 0; i < 2500; i++) { //testing amount
    let energyGenerator = new EnergyGenerator(0, 0, 'Energy Generator','purple', Math.floor(Math.random() * 5), Math.floor(Math.random() * 100)+1, 0)
    generateItemOnAvailablePlace(energyGenerator, generators)
}

function generateItemOnAvailablePlace(entity, array){
    if(typeof foreground[entity['x']][entity['y']]['type'] == 'undefined'){
        foreground[entity['x']][entity['y']] = entity
        array.push(entity)
    }
    else{
        entity['x'] = Math.floor(Math.random() * mapSizeX)
        entity['y'] = Math.floor(Math.random() * mapSizeY)
        generateItemOnAvailablePlace(entity, array)
    }
}
d2 = new Date()
console.log("Generating energy generators took " + (d2.getTime() - d1.getTime()) + " ms")

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
console.log("Creating bots...")
d1 = new Date()
function checkOnDuplicateName(data, attempt){
    /*if(bots.map(function(e) { return e.name; }).indexOf(data) == -1){
        bots.push(new Bot(data, spawnX, spawnY, data))
    }
    else{*/
        /*if(attempt == 0){
            data = data+0
        }
        else{
            data = data.replace(attempt-1, attempt)
        }*/
        data+=attempt
        bots.push(new Bot(data, spawnX, spawnY, data))
    //checkOnDuplicateName(data, attempt)
    //}
}

for (let i = 0; i < 500; i++) { //testing amount
    checkOnDuplicateName('test', i)
}    

for (let x = 0; x < bots.length; x++) {
    moveEntityTowardsTarget(bots[x], generators[Math.floor(Math.random() * generators.length)])
}

//#region pathfinding
function moveEntityTowardsTarget(bot, target){
    let route = findShortestPath(bot, target)
    if(!route){
        //when it can't reach target
    }
    else{
        for (let i = 0; i < route.length; i++) {
            setTimeout(function() { 
                if(i != route.length - 1){ 
                    if(route[i] == 'north'){
                        bot['y']--
                        //background[bot['x']][bot['y']]['color'] = 'green'
                    }
                    else if (route[i] == 'east'){
                        bot['x']++
                        //background[bot['x']][bot['y']]['color'] = 'green'
                    }
                    else if (route[i] == 'south'){
                        bot['y']++
                        //background[bot['x']][bot['y']]['color'] = 'green'
                    }
                    else if (route[i] == 'west'){
                        bot['x']--
                        //background[bot['x']][bot['y']]['color'] = 'green'
                    }
                }
                else{
                    checkWhatToDo(bot, target)
                }
            }, 100 * i) 
        }
    }
}

function checkWhatToDo(bot, target){
    if(target['type'] == 'generator'){
        let obtainEnergyTimer = setInterval(() => {
            if(bot['energy'] >= bot['maxEnergy']){
                bot['energy'] = bot['maxEnergy']
                moveEntityTowardsTarget(bot, {x:spawnX, y:spawnY, type:'spawn'})
                clearInterval(obtainEnergyTimer)
            }

            if(target['energy'] > 0){
                if(target['energy'] > 0){
                    bot['energy']++
                    target['energy']--
                }
                else if (target['energy'] == 0){
                    setTimeout(() => {
                        bot['energy']++
                        target['energy']--
                    },target['generationInterval']);
                }
            }
        }, 500)
    }
}

function translateMapToGrid(target){
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
            if(foreground[i][x]['type'] == 'generator'){
                grid[i][x] = 'blocked'
            }
        }
    }
    grid[target['x']][target['y']] = ('goal')
    return grid
}

function findShortestPath(startEntity, target){
    let grid = translateMapToGrid(target)

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
                queue = []
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
        x++
    }
    else if (direction == 'west'){
        x--
    }
    else if (direction == 'south'){
        y++
    }
    else if (direction == 'north'){
        y--
    }
    
    let newLocation = {
        x: x,
        y: y,
        path: newPath,
        status: 'unknown'
    }
    newLocation['status'] = retrieveLocationStatus(newLocation, grid)

    if(newLocation['status'] == 'valid'){
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
    else if (grid[location['x']][location['y']] == 'blocked' || grid[location['x']][location['y']] == 'visited'){
        return 'blocked'
    }
}
//#endregion

d2 = new Date()
console.log("Generating bots and finding their shortest path took " + (d2.getTime() - d1.getTime()) + " ms")