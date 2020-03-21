module.exports = class Bot {
    constructor(){
        this.name //bots own name
        //this.x //the current x
        //this.y //the current y
        this.owner //maybe a user with different name than bot when using accounts
        //this.type = 'bot' //for checking client side how to update the selected entity
        //this.color = 'black'
        //this.energy = 0
        //this.maxEnergy = 10
        //this.map
        this.queue = [] //the queue for all the given commands
    }    
}