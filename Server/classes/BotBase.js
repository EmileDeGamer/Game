module.exports = class Bot {
    constructor(){
        this.name //bots own name
        this.x //the current x
        this.y //the current y
        this.owner //your own username of your account
        this.type //automatic set to bot
        this.color
        this.energy
        this.maxEnergy
        this.queue //the queue for all the given commands
        this.returnedData //the data from the queued commands
        this.spawn //will be set to the middle of map
    }    

    init(){
        setInterval(() => {
            if(this.returnedData.length > 0){
                let task = this.returnedData.shift()
                if(typeof task['type'] !== undefined){
                    this.queue.push(task)
                }
            }
        }, 1000)
    }

    //sending data must be an object
    sendCommand(data = {}){
        this.queue.push(data)
    }
}