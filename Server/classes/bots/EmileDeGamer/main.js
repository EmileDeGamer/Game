let BotBase = require("../../BotBase")

module.exports = class Bot extends BotBase{
    constructor(){
        super()
        console.log('Bot ' + this.name + ' is up and running :D')
    }
}