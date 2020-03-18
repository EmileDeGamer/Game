let BotBase = require("../../BotBase")

module.exports = class Bot extends BotBase{
    constructor(){
        super()
        name = "pizza"
        
        console.log('Bot ' + this.name + ' is up and running :D')
    }
}