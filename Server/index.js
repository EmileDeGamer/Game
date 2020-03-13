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
console.log(background.length)

for (let i = 0; i < 250; i++) {
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

    setInterval(() => {
        /*for (let i = 0; i < background.length; i++) {
            background[i]['color'] = colors[randomIndexOfColor]
        }
        randomIndexOfColor = Math.floor(Math.random() * colors.length)*/
        socket.emit('updateMap', {map:background, name:'background'})
    }, 1000)

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
        //socket.emit('changedNameTo', data)
    }
    else{
        checkOnDuplicateName(data + attempt++, attempt++, socket)
    }
}

for (let i = 0; i < 50; i++) {
    checkOnDuplicateName('test', 0, 'test')
}

setTimeout(() => {
    for (let i = 0; i < bots.length; i++) {
        retrieveNeighboursAndCalculateDistance(bots[i], generators[0])
    }
    console.log(generators[0])
}, 1000)



function retrieveNeighboursAndCalculateDistance(a, b){
    for (let i = 0; i < background.length; i++) {
        if(background[i]['x'] == a['x'] + 1 && background[i]['y'] == a['y']){
            calculateFCost(i,b)
        }
        else if(background[i]['x'] == a['x'] - 1 && background[i]['y'] == a['y']){
            calculateFCost(i,b)
        }
        else if(background[i]['x'] == a['x'] && background[i]['y'] == a['y'] + 1){
            calculateFCost(i,b)
        }
        else if(background[i]['x'] == a['x'] && background[i]['y'] == a['y'] - 1){
            calculateFCost(i,b)
        }
    }

    let costs = []
    for (let i = 0; i < background.length; i++) {
        if(background[i]['color'] != 'red' && background[i]['color'] != 'blue'){
            if(typeof background[i]['fCost'] != 'undefined'){
                if(costs.indexOf(background[i]['fCost']) == -1){
                    costs.push(background[i]['fCost'])
                }
            }
        }
    }

    let lowestValue = Math.min.apply(Math, costs) 

    for (let i = 0; i < background.length; i++) {
        if(typeof background[i]['fCost'] != 'undefined'){
            if(background[i]['fCost'] == lowestValue){
                //first check if nothing is on the way
                //todo

                background[i]['color'] = 'blue'
                if(background[i]['x'] == b['x'] && background[i]['y'] == b['y']){
                    break
                }
                /*else if(background[i]['x'] + 1 == b['x'] && background[i]['y'] == b['y']){
                    break
                }
                else if(background[i]['x'] - 1 == b['x'] && background[i]['y'] == b['y']){
                    break
                }
                else if(background[i]['x'] == b['x'] && background[i]['y'] + 1 == b['y']){
                    break
                }
                else if(background[i]['x'] == b['x'] && background[i]['y'] - 1 == b['y']){
                    break
                }*/
                else{
                    retrieveNeighboursAndCalculateDistance(background[i], b)
                    break
                }
            }
            
        }
    }
    for (let i = 0; i < background.length; i++) {
        if(background[i]['color'] == 'green'){
            if(typeof background[i]['fCost'] != 'undefined'){
                if (background[i]['fCost'] != lowestValue){
                    background[i]['color'] = 'red'
                }
            }
        }
    }
}

function calculateFCost(i,b){
    background[i]['hCost'] = calculateManhattanDistance(background[i],b)
    background[i]['fCost'] = background[i]['hCost']
    if(background[i]['color'] != 'red' && background[i]['color'] != 'blue'){
        background[i]['color'] = 'green'
    }
}

function calculateManhattanDistance(a,b){
    let manhattanX = Math.abs(a['x'] - b['x'])
    let manhattanY = Math.abs(a['y'] - b['y'])
    let manhattan = Math.abs(manhattanX + manhattanY)
    return manhattan
}