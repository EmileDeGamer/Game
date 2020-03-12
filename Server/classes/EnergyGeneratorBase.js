module.exports = class EnergyGeneratorBase{
    constructor(x, y, color, generationInterval, maxEnergy, startEnergy){
        this.maxEnergy = maxEnergy
        this.currentEnergy = startEnergy
        this.x = x
        this.y = y
        this.color = color
        let generator = this

        for (let i=this.currentEnergy; i<=this.maxEnergy; i++) { 
            setTimeout(function() { 
                generator.currentEnergy = i
            }, generationInterval * 1000 * i)
        }
    }

    getEnergy(){
        return this.currentEnergy
    }
}