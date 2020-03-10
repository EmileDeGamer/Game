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

let map = []
let coordX = 0, coordY = 0
for (let i = 0; i < 100; i++) {
    for (let x = 0; x < 100; x++) {
        map.push({x:coordX,y:coordY,color:"white"})
        coordX++
    }
    coordY++
    coordX=0
}
map[0]['color'] = 'red';

io.on('connection', function(socket){
    console.log('connection made!')  

    socket.emit('updateMap', map)

    socket.on('disconnect', function(){
        console.log('disconnected! :(')
    })
})



