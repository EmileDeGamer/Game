module.exports = class Bot {
    constructor(){
        this.name //bots own name
        this.x //the current x
        this.y //the current y
        this.owner //maybe a user with different name than bot when using accounts
        this.type //for checking client side how to update the selected entity
        this.color
        this.energy
        this.maxEnergy
        this.map
        this.queue //the queue for all the given commands
        this.mapSizeX
        this.mapSizeY
    }    

    init(){
        console.log(this['owner'] + this['name'])
    }
}