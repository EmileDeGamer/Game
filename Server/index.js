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
let bcrypt = require('bcryptjs')
let session = require('express-session')

//#region database functions
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

function createInsertString(table, valuesObject = {}){
    let insertString = ''
    let valuesString = ''
    let index = 0
    for (const [key, value] of Object.entries(valuesObject)) {
        if(index == 0){
            insertString += key
            valuesString += "'" + value + "'"
        }
        else{
            insertString += ", " + key
            valuesString += ",'" + value + "'"
        }
        index++
    }
    return "INSERT INTO " + table + " (" + insertString + ") VALUES (" + valuesString + ")"
}

function createGetDataString(table, whereObject = {}){
    let whereString = ''
    let index = 0
    for (const [key, value] of Object.entries(whereObject)) {
        if(index == 0){
            whereString += key + " = '" + value + "'"
        }
        else{
            whereString += " AND " + key + " = '" + value + "'"
        }
        index++
    }
    return "SELECT * FROM " + table + " WHERE " + whereString
}

function deleteData(table, whereObject = {}){
    let whereString = ''
    let index = 0
    for (const [key, value] of Object.entries(whereObject)) {
        if(index == 0){
            whereString += key + " = '" + value + "'"
        }
        else{
            whereString += " AND " + key + " = '" + value + "'"
        }
        index++
    }
    con.query("DELETE FROM " + table + " WHERE " + whereString, function(err, result){
        if(err){
            console.log(err)
        }
        else{

        }
    })
}

function updateData(table, whatToUpdateObject = {}, whereObject = {}){
    let whereString = ''
    let index = 0
    for (const [key, value] of Object.entries(whereObject)) {
        if(index == 0){
            whereString += key + " = '" + value + "'"
        }
        else{
            whereString += " AND " + key + " = '" + value + "'"
        }
        index++
    }
    let updateString = ''
    index = 0
    for (const [key, value] of Object.entries(whatToUpdateObject)) {
        if(index == 0){
            updateString += key + " = '" + value + "'"
        }
        else{
            updateString += " AND " + key + " = '" + value + "'"
        }
        index++
    }
    con.query("UPDATE " + table + " SET " + updateString + " WHERE " + whereString, function(err, result){
        if(err){
            console.log(err)
        }
        else{

        }
    })
}

//#endregion

//#region regexes
let nameRegex = /^[a-zA-Z -]{3,255}$/
let usernameRegex = /^[a-zA-Z0-9_-]{3,15}$/
let emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/
//#endregion

app.set('view engine', 'pug')
app.set('views','./views')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({secret: "*&*&*&*&*&*", saveUninitialized: false, resave: false}))
app.use(express.static('public'))

//#region routes
//#region pages
app.get('/', function(req, res){
    if(req.session.user != null){
        res.render('index')
    }
    else{
        res.redirect('/login')
    }
})

app.get('/game', function(req, res){
    if(req.session.user != null){
        res.redirect('/')
    }
    else{
        res.redirect('/login')
    }
})

app.get('/login', function(req, res){
    if(req.session.user != null){
        res.redirect('/')
    }
    else{
        res.render('login')
    }
})

app.get('/register', function(req, res){
    if(req.session.user != null){
        res.redirect('/')
    }
    else{
        res.render('register')
    }
})

app.get('*', function(req, res){
    res.send('Sorry, this is an invalid URL.')
})
//#endregion

//#region posts
app.post('/login', function(req, res){
    let errors = []
    let userInput = {username: req.body.username}
    if(req.body.username === ""){
        errors.push("Username can't be empty")
    }
    if(req.body.password === ""){
        errors.push("Password can't be empty")
    }
    if(errors.length == 0){
        let query = createGetDataString("users", {username:req.body.username})
        con.query(query, function(err, result){
            if(err){
                
            }
            else{
                if(result.length == 0){
                    errors.push("user doesn't exist")
                    res.render("login", {errors: errors, input: userInput})
                }
                else{
                    let data = result[0]
                    if(bcrypt.compareSync(req.body.password, data['password'])){
                        req.session.user = userInput
                        res.redirect('/')
                    }
                    else{
                        errors.push('wrong password, try again')
                        res.render("login", {errors: errors, input: userInput})
                    }
                }
            }
        })
    }
    else{
        res.render("login", {errors: errors, input: userInput})
    }
})

app.post('/register', function(req, res){
    let userInput = {name: req.body.name, username: req.body.username, email: req.body.email}
    let errors = []
    console.log(userInput)
    if(req.body.name === ""){
        errors.push("Name can't be empty")
    }
    if(req.body.username === ""){
        errors.push("Username can't be empty")
    }
    if(req.body.email === ""){
        errors.push("Email can't be empty")
    }
    if(req.body.password === ""){
        errors.push("Password can't be empty")
    }
    if(!req.body.password.match(req.body.repeatPassword)){
        errors.push("Passwords are not the same")
    }
    if(!req.body.name.match(nameRegex)){
        errors.push("Name cannot have numbers")
    }
    if(!req.body.username.match(usernameRegex)){
        errors.push("Username cannot have spaces and min length: 3, max length: 15")
    }
    if(!req.body.email.match(emailRegex)){
        errors.push("Email cannot have spaces")
    }
    if(!req.body.password.match(passwordRegex)){
        errors.push("Password must have 8 characters, 1 lower case, 1 upper case, 1 number")
    }
    if(errors.length === 0){
        let hash = bcrypt.hashSync(req.body.password, 8)
        let query = createInsertString('users', {name:req.body.name, username:req.body.username, email:req.body.email, password:hash})
        con.query(query, function(err, result){
            if(err){
                errors.push("Username already in use")
                res.render("register", {errors: errors, input: userInput})
            }
            else{
                req.session.user = userInput
                res.redirect('/')
            }
        })
    }
    else{
        res.render("register", {errors: errors, input: userInput})
    }
})
//#endregion

http.listen(process.env.PORT, function(){
    console.log("listening on " + process.env.PORT)
})
//#endregion

//#endregion

//#region classes
let Bot = require("./classes/BotBase")
let EnergyGenerator = require("./classes/EnergyGeneratorBase")
//#endregion

//#region game vars
let background = [], foreground = [], bots = [], generators = []
let maxX = 99
let maxY = 99
let mapSizeX = maxX + 1
let mapSizeY = maxY + 1
let spawnX = Math.floor(mapSizeX / 2), spawnY = Math.floor(mapSizeY / 2)
let pieceSize = 10 //in pixels
//#endregion

//#region generate game entities
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
//#endregion

//#region pathfinding
function moveEntityTowardsTarget(bot, target){
    let route = findShortestPath(bot, target)
    if(!route){
        //when it can't reach target
        console.log('unreachable target')
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

d2 = new Date()
console.log("Generating bots and finding their shortest path took " + (d2.getTime() - d1.getTime()) + " ms")
//#endregion

//#region realtime updates
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
//#endregion