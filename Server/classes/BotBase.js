module.exports = class Bot {
    constructor(name, x, y, owner, map){
        this.name = name //bots own name
        this.x = x //the current x
        this.y = y //the current y
        this.owner = owner //maybe a user with different name than bot when using accounts
        this.type = 'bot' //for checking client side how to update the selected entity
        this.color = 'black'
        this.energy = 0
        this.maxEnergy = 10
        this.map = map
        this.queue = [] //the queue for all the given commands
    }    
}