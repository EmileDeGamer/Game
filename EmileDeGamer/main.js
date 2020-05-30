//you got acces to this.sendCommand(Object) which sends data to the send to the server
//the server handles the data and your bot gets the data back
//if you do something wrong you will notice an alert popup in the browser
//notice to call your folder the as your username in game otherwise it won't work

let BotBase = require("../../BotBase")

module.exports = class Bot extends BotBase{
    constructor(){
        super()
        let readyToStart = setInterval(() => {
            if(this.ready){
                this.sendCommand({x:20,y:1})
                clearInterval(readyToStart)
            }
        }, 100)
    }
}