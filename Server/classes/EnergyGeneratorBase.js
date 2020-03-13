module.exports = class EnergyGeneratorBase{
    constructor(x, y, name, color, generationInterval, maxEnergy, startEnergy){
        this.maxEnergy = maxEnergy
        this.currentEnergy = startEnergy
        this.x = x
        this.y = y
        this.color = color
        this.name = name
        this.type = 'generator'
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