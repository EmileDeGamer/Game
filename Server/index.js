//needs to send the real time view to the client
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

let background = [], foreground = [], bots = []
let coordX = 0, coordY = 0
for (let i = 0; i < 100; i++) {
    for (let x = 0; x < 100; x++) {
        background.push({x:coordX,y:coordY,color:"red"})
        coordX++
    }
    coordY++
    coordX=0
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

    socket.on('disconnect', function(){
        console.log('disconnected! :(')
    })

    socket.on('createMe', function(data){
        checkOnDuplicateName(data, 0, socket)
        io.emit('updateMap', {map:background,name:'background'})
    })
 
    /*setInterval(() => {
        for (let i = 0; i < background.length; i++) {
            background[i]['color'] = colors[randomIndexOfColor]
        }
        randomIndexOfColor = Math.floor(Math.random() * colors.length)
        socket.emit('updateMap', background)
    }, 1000)*/

    socket.on('move', function(data){
        for (let i = 0; i < bots.length; i++) {
            if(bots[i]['name'] == data['name']){
                if(data['direction'] == "w"){
                    bots[i]['y']--
                }
                else if (data['direction'] == "a"){
                    bots[i]['x']--
                }
                else if (data['direction'] == "s"){
                    bots[i]['y']++
                }
                else if (data['direction'] == "d"){
                    bots[i]['x']++
                }
            }
        }
    })

    setInterval(() => {
        foreground = []
        for (let x = 0; x < bots.length; x++) {
            foreground.push({x:bots[x]['x'], y:bots[x]['y'], color:'black', name:bots[x]['name']})
        }
        io.emit('updateMap', {map:foreground, name:'foreground'})
    }, 1000/60)
})

function checkOnDuplicateName(data, attempt, socket){
    if(bots.indexOf(data) == -1){
        bots.push({name:data, x:49, y:49, owner:data})
        socket.emit('changedNameTo', data)
    }
    else{
        let newName = data + attempt
        attempt++
        checkOnDuplicateName(newName, attempt, socket)
    }
}