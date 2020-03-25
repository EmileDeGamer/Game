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
        this.queue //the queue for all the given commands
        this.returnedData //the data from the queued commands
        //this.map
        //this.mapSizeX
        //this.mapSizeY
        this.spawn
    }    

    init(){
        console.log(this['owner'] + this['name'])
        this.whatIsOn(0,0)
        
        setInterval(() => {
            if(this.returnedData.length > 0){
                let task = this.returnedData.shift()
                if(task == "fullWithEnergy"){
                    this.moveMeTo(this.spawn)
                }
                else{
                    this.moveMeTo(task)
                }
            }
        }, 5000)
    }

    whatIsOn(x, y){
        this.queue.push({type:'getPosData', x:x, y:y})
    }

    moveMeTo(target){
        this.queue.push({type:'moveMeTo', target:target})
    }
}