let BotBase = require("../../BotBase")

module.exports = class Bot extends BotBase{
    constructor(){
        super('henk') //name, x, y, owner, map
        console.log('Bot ' + this.name + ' is up and running :D')
    }
}