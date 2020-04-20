//#region base
let express = require("express")
let app = express()
let http = require('http').createServer(app)
let bodyParser = require('body-parser')
let mysql = require('mysql')
require('dotenv').config()
let io = require('socket.io')(http)
let bcrypt = require('bcryptjs')
let session = require('express-session')
let fs = require('fs')
let multer  = require('multer')
let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
     },
    filename: function (req, file, cb) {
        cb(null , file.originalname);
    }
})
let upload = multer({ storage:storage })
let AdmZip = require('adm-zip')

let deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = path + '/' + file
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath)
            } else {
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}

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
        let errors = req.session.errors
        delete req.session.errors
        res.render("index", {userData: req.session.user, errors:errors})
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

app.get('/logout', function(req, res){
    if(req.session.user != null){
        req.session.destroy()
        res.redirect('/login')
    }
    else{
        res.redirect('/login')
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
        con.query(createGetDataString("users", {username:req.body.username}), function(err, result){
            if(err){
                console.log(err)
            }
            else{
                if(result.length == 0){
                    errors.push("user doesn't exist")
                    res.render("login", {errors: errors, input: userInput})
                }
                else{
                    if(bcrypt.compareSync(req.body.password, result[0]['password'])){
                        let userDataQuery = "SELECT * FROM users INNER JOIN stats ON users.username = stats.username WHERE users.username = '" + req.body.username + "'"
                        con.query(userDataQuery, function(err, result){
                            if(err){
                                errors.push("user doesn't exist")
                                res.render("login", {errors: errors, input: userInput})
                            }
                            else{
                                req.session.user = {name:result[0]['name'],username:result[0]['username'],email:result[0]['email'],level:result[0]['level'],xp:result[0]['xp'],currency:result[0]['currency']}
                                res.redirect('/')
                            }
                        })
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
        con.query(createInsertString('users', {name:req.body.name, username:req.body.username, email:req.body.email, password:hash}), function(err, result){
            if(err){
                errors.push("Username already in use")
                res.render("register", {errors: errors, input: userInput})
            }
            else{
                con.query(createInsertString('stats', {username:req.body.username}), function(err, result){
                    if(err){
                        errors.push("Username already in use")
                        res.render("register", {errors: errors, input: userInput})
                    }
                    else{
                        let userDataQuery = "SELECT * FROM users INNER JOIN stats ON users.username = stats.username WHERE users.username = '" + req.body.username + "'"
                        con.query(userDataQuery, function(err, result){
                            if(err){
                                console.log(err)
                            }
                            else{
                                req.session.user = {name:result[0]['name'],username:result[0]['username'],email:result[0]['email'],level:result[0]['level'],xp:result[0]['xp'],currency:result[0]['currency']}
                                res.redirect('/')
                            }
                        })
                    }
                })
            }
        })
    }
    else{
        res.render("register", {errors: errors, input: userInput})
    }
})

app.post('/uploadBot', upload.single('uploadedBot'), function(req, res){
    if(req.file['mimetype'] == 'application/x-zip-compressed'){
        let newName = req.file.originalname.replace('.zip','')
        if(fs.existsSync('./classes/bots/'+newName)){
            deleteFolderRecursive('./classes/bots/'+newName)
            let zip = new AdmZip(req.file.path)
            zip.extractAllTo('./classes/bots/'+newName, true)
            fs.unlinkSync('./uploads/'+req.file.originalname)
            res.redirect('/')
        }
        else{
            let zip = new AdmZip(req.file.path)
            zip.extractAllTo('./classes/bots/'+newName, true)
            fs.unlinkSync('./uploads/'+req.file.originalname)
            res.redirect('/')
        }
        setTimeout(() => {
            reloadBotClasses()
        }, 5000)
    }
    else{
        fs.unlinkSync('./uploads/'+req.file.originalname)
        req.session.errors = ['File must be a zip']
        res.redirect('/')
    }
})
//#endregion

http.listen(process.env.PORT, function(){
    console.log("listening on " + process.env.PORT)
})
//#endregion
//#endregion

//#region game vars
let background = [], foreground = [], bots = [], generators = [], entities = []
let maxX = 99
let maxY = 99
let mapSizeX = maxX + 1
let mapSizeY = maxY + 1
let spawnX = Math.floor(mapSizeX / 2), spawnY = Math.floor(mapSizeY / 2)
let spawn = {x: spawnX, y: spawnY, type: 'spawn'}
let pieceSize = 10 //in pixels
//#endregion

//#region classes
let EnergyGenerator = require("./classes/EnergyGeneratorBase")

let readedBotClasses
let botClasses
reloadBotClasses()

function reloadBotClasses(){
    readedBotClasses = fs.readdirSync('./classes/bots/')
    botClasses = []
    for (let i = 0; i < readedBotClasses.length; i++) {
        let userBotFolder = fs.readdirSync('./classes/bots/' + readedBotClasses[i])
        for (let x = 0; x < userBotFolder.length; x++) {
            if(userBotFolder[x] == 'main.js'){
                botClasses.push({main:'./classes/bots/' + readedBotClasses[i] + '/' + userBotFolder[x],username:readedBotClasses[i]})
            }
        }
    }

    for (let i = 0; i < botClasses.length; i++) {
        botClasses[i]['main'] = require(botClasses[i]['main'])
        console.log(botClasses[i]['username'])
    }
}

//#endregion

//#region generate game entities
let d1 = new Date()
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
let d2 = new Date()
console.log("Generating foreground and background took " + (d2.getTime() - d1.getTime()) + " ms")
console.log("Generating entities...")
d1 = new Date()
for (let i = 0; i < 1500; i++) {
    let wall = {x:0,y:0,color:'orange',type:'wall',name:'wall'}
    generateItemOnAvailablePlace(wall, entities)
}
for (let i = 0; i < 250; i++) { //testing amount
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
console.log("Generating entities took " + (d2.getTime() - d1.getTime()) + " ms")

console.log("Creating bots...")
d1 = new Date()
function checkOnDuplicateName(bot, attempt = 0){
    let tName = bot['name'] + attempt
    if(bots.map(function(b) { if(b['owner'] == bot['owner']){return b['name']} }).indexOf(tName) == -1){
        bot['name'] += attempt
    }
    else{
        checkOnDuplicateName(bot, attempt+=1)
    }
}   
//#endregion

//#region pathfinding
function moveEntityTowardsTarget(bot, target, map, moveOnTheTarget){
    let route = findShortestPath(bot, target, map)
    if(!route){
        //when it can't reach target
        console.log('unreachable target')
    }
    else{
        /*let currentCoords = {x:bot['x'], y:bot['y']}
        for (let i = 0; i < route.length; i++) {
            if(route[i] == 'up'){
                currentCoords['y']--
                background[currentCoords['x']][currentCoords['y']]['color'] = 'green'
            }
            else if (route[i] == 'right'){
                currentCoords['x']++
                background[currentCoords['x']][currentCoords['y']]['color'] = 'green'
            }
            else if (route[i] == 'down'){
                currentCoords['y']++
                background[currentCoords['x']][currentCoords['y']]['color'] = 'green'
            }
            else if (route[i] == 'left'){
                currentCoords['x']--
                background[currentCoords['x']][currentCoords['y']]['color'] = 'green'
            }
        }*/
        setTimeout(function(){botBehaviour(0, moveOnTheTarget, route, bot, target)}, 1000 / bot['speed']) 
    }
}

function botBehaviour(index, moveOnTheTarget, route, bot, target){
    if(moveOnTheTarget){
        movementController(bot, route[index])
        if(index == route.length - 1){
            checkWhatToDo(bot, target)
        }
    }
    else{
        if(index != route.length - 1){ 
            movementController(bot, route[index])
        }
        else{
            checkWhatToDo(bot, target)
        }
    }
    if(index == route.length){
        return
    }
    index++
    setTimeout(function(){botBehaviour(index, moveOnTheTarget, route, bot, target)}, 1000 / bot['speed'])
}

function movementController(bot, route){
    if(route == 'up'){
        bot['y']--
        if(background[bot['x']][bot['y']]['type'] == 'mud'){
            bot['speed'] = 5
        }
        else{
            bot['speed'] = 10
        }
    }
    else if (route == 'right'){
        bot['x']++
        if(background[bot['x']][bot['y']]['type'] == 'mud'){
            bot['speed'] = 5
        }
        else{
            bot['speed'] = 10
        }
    }
    else if (route == 'down'){
        bot['y']++
        if(background[bot['x']][bot['y']]['type'] == 'mud'){
            bot['speed'] = 5
        }
        else{
            bot['speed'] = 10
        }
    }
    else if (route == 'left'){
        bot['x']--
        if(background[bot['x']][bot['y']]['type'] == 'mud'){
            bot['speed'] = 5
        }
        else{
            bot['speed'] = 10
        }
    }
}

function checkWhatToDo(bot, target){
    if(target['type'] == 'generator'){
        let obtainEnergyTimer = setInterval(() => {
            if(bot['energy'] >= bot['maxEnergy']){
                bot['energy'] = bot['maxEnergy']
                bot['returnedData'].push(bot['spawn'])
                clearInterval(obtainEnergyTimer)
            }
            if(bot['maxEnergy'] > bot['energy']){
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
            }
        }, 500)
    }
}

function mapToGrid(target, map){
    let grid = []
    for (let x = 0; x < mapSizeX; x++) {
        let row = []
        for (let y = 0; y < mapSizeY; y++) {
            if(target['x'] == x && target['y'] == y){
                row.push({type:'g'})
            }
            else if(map[x][y]['type'] == 'bot'){
                row.push({type:'v'})
            }
            else if(map[x][y]['type'] == 'wall' || map[x][y]['type'] == 'generator'){
                row.push({type:'b'})
            }
            else{
                row.push({type:'v'})
            }
        }
        grid.push(row)
    }
    return grid
}

function calculateManhattanDistance(a, b){
    return Math.abs(b['x'] - a['x']) + Math.abs(b['y'] - a['y'])
}

function findShortestPath(bot, target, map){
    let grid = mapToGrid(target, map)
    bot['path'] = []
    let queue = [bot]
    while(queue.length > 0){
        let lowestIndex = 0
        for (let i = 0; i < queue.length; i++) {
            if(queue[lowestIndex]['manhattan'] > queue[i]['manhattan']) { lowestIndex = i }
        }
        let currentLocation = queue[lowestIndex]
        queue.splice(lowestIndex, 1)
        let directions = ['up', 'down', 'left', 'right']
        for (let i = 0; i < directions.length; i++) {
            let newLocation = retrieveNeighboursFromDirection(currentLocation, directions[i], grid)
            if(newLocation['type'] == 'g'){
                grid = []
                queue = []
                return newLocation['path']
            }
            else if(newLocation['type'] == 'v'){
                grid[newLocation['x']][newLocation['y']]['type'] = 's'
                //background[newLocation['x']][newLocation['y']]['color'] = 'blue'
                newLocation['manhattan'] = calculateManhattanDistance(newLocation, target)
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
    if(direction == 'right' && x+1 < mapSizeX){
        x++
    }
    else if (direction == 'left' && x-1 >= 0){
        x--
    }
    else if (direction == 'down' && y+1 < mapSizeY){
        y++
    }
    else if (direction == 'up' && y-1 >= 0){
        y--
    }
    return {x:x,y:y,path:newPath,manhattan:grid[x][y]['manhattan'], type:grid[x][y]['type']}
}

d2 = new Date()
console.log("Generating bots and finding their shortest path took " + (d2.getTime() - d1.getTime()) + " ms")
//#endregion

//#region realtime updates
let users = []

io.on('connection', function(socket){
    console.log('connection made!')  
    socket.on('iAm', function(data){
        users.push({username:data['username'],socket:socket})
    })
    socket.emit('createMap', {maxX: maxX, maxY: maxY, pieceSize: pieceSize})
    socket.on('createBot', function(data){
        for (let i = 0; i < botClasses.length; i++) {
            if(data['username'] == botClasses[i]['username']){
                let bot = new botClasses[i]['main']
                bot['x'] = spawnX
                bot['y'] = spawnY
                bot['type'] = 'bot'
                bot['speed'] = 10
                bot['energy'] = 0
                bot['maxEnergy'] = 10
                bot['owner'] = data['username']
                bot['name'] = 'bot'
                bot['color'] = 'black'
                bot['queue'] = []
                bot['returnedData'] = []
                bot['spawn'] = spawn
                bot['ready'] = true
                checkOnDuplicateName(bot)
                bot.init()
                bots.push(bot)
            }
        }
        let ownedBots = []
        for (let i = 0; i < bots.length; i++) {
            if(bots[i]['owner'] == data['username']){
                ownedBots.push(bots[i])
            }
        }
        socket.emit('ownedBots', ownedBots)
    })

    //#region disconnecting for testing, later bots when they die they will be removed from array
    socket.on('disconnect', function(){
        console.log('disconnected! :(')
        if(users.map(function(u) { return u.socket; }).indexOf(socket) !== -1){
            users.splice(users.map(function(u) { return u.socket; }).indexOf(socket), 1)
        }
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
        for (let i = 0; i < entities.length; i++) {
            foreground[entities[i]['x']][entities[i]['y']] = entities[i]
        }
        for (let i = 0; i < generators.length; i++) {
            foreground[generators[i]['x']][generators[i]['y']] = generators[i]
        }
        for (let i = 0; i < bots.length; i++) {
            foreground[bots[i]['x']][bots[i]['y']] = bots[i]
        }
        io.emit('updateMap', {map:foreground, name:'foreground'})
    }, 1000/10)
    //#endregion

    //area where users send commands to the server
    setInterval(() => {
        for (let i = 0; i < bots.length; i++) {
            if(bots[i]['queue'].length > 0 && bots[i]['ready']){
                let command = bots[i].queue.shift()
                bots[i]['ready'] = false
                if(typeof command['x'] !== 'undefined' && typeof command['y'] !== 'undefined'){
                    if(typeof command['type'] !== 'undefined'){
                        if(command['type'] == 'generator'){
                            moveEntityTowardsTarget(bots[i], command, foreground, false)
                            bots[i]['ready'] = true
                        }
                        else if(command['type'] == 'spawn'){
                            moveEntityTowardsTarget(bots[i], command, foreground, true)
                            bots[i]['ready'] = true
                        }
                    }
                    else{
                        if(foreground[command['x']][command['y']]['name'] == bots[i]['name'] && foreground[command['x']][command['y']]['owner'] == bots[i]['owner']){
                            let user = users.find(user => user.username === bots[i]['owner'])
                            user.socket.emit('errorMessage', 'you found yourself')
                            bots.splice(i, 1)
                            let ownedBots = []
                            for (let i = 0; i < bots.length; i++) {
                                if(bots[i]['owner'] == user.username){
                                    ownedBots.push(bots[i])
                                }
                            }
                            user.socket.emit('ownedBots', ownedBots)
                        }
                        else if(JSON.stringify(foreground[command['x']][command['y']]) == "{}"){
                            let user = users.find(user => user.username === bots[i]['owner'])
                            user.socket.emit('errorMessage', 'there is nothing')
                            bots.splice(i, 1)
                            let ownedBots = []
                            for (let i = 0; i < bots.length; i++) {
                                if(bots[i]['owner'] == user.username){
                                    ownedBots.push(bots[i])
                                }
                            }
                            user.socket.emit('ownedBots', ownedBots)
                        }
                        else if(foreground[command['x']][command['y']]['type'] == 'wall'){
                            let user = users.find(user => user.username === bots[i]['owner'])
                            user.socket.emit('errorMessage', 'that\'s a wall')
                            bots.splice(i, 1)
                            let ownedBots = []
                            for (let i = 0; i < bots.length; i++) {
                                if(bots[i]['owner'] == user.username){
                                    ownedBots.push(bots[i])
                                }
                            }
                            user.socket.emit('ownedBots', ownedBots)
                        }
                        else{
                            returnDataToBot(bots[i], foreground[command['x']][command['y']])
                        }
                    }
                }
                else{
                    let user = users.find(user => user.username === bots[i]['owner'])
                    user.socket.emit('errorMessage', 'you gave no x and y')
                    bots.splice(i, 1)
                    let ownedBots = []
                    for (let i = 0; i < bots.length; i++) {
                        if(bots[i]['owner'] == user.username){
                            ownedBots.push(bots[i])
                        }
                    }
                    user.socket.emit('ownedBots', ownedBots)
                }
            }
        }
    }, 1000)
})

function returnDataToBot(bot, data){
    bot['returnedData'].push(data)
    bot['ready'] = true
}
//#endregion