module.exports = class Bot {
    constructor(name, x, y, owner, socket){
        this.name = name //bots own name
        this.x = x //the current x
        this.y = y //the current y
        this.owner = owner //maybe a user with different name than bot when using accounts
        this.type = 'bot' //for checking client side how to update the selected entity
        this.socket = socket //for disconnecting to know which bot to delete
    }    

    /*moveTowardsEntity(entity){
        console.log(entity)
    }*/

    moveTowardsCoord(x, y){
        console.log('?')
    }
}