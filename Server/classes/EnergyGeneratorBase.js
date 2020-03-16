module.exports = class EnergyGeneratorBase{
    constructor(x, y, name, color, generationInterval, maxEnergy, startEnergy){
        this.maxEnergy = maxEnergy
        this.energy = startEnergy
        this.x = x
        this.y = y
        this.color = color
        this.name = name
        this.type = 'generator'
        this.generationInterval = generationInterval * 1000
        let generator = this

        setInterval(() => {
            if(generator.energy < generator.maxEnergy){
                setTimeout(function() { 
                    generator.energy++
                }, generator.generationInterval)
            }
        }, generator.generationInterval)
    }

    getEnergy(){
        return this.energy
    }
}