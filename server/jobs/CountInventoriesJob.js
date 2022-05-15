const Job = require('./Job')

const sequelize = require('sequelize')
const models = require('../models/index')
const StoreInventory = models.StoreInventory


class CountInventoriesJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'CountInventoriesJob'

            this.process = async (data = null) => {
                const storeId = data
                const amountCountedPerProcess = 100
                const totalInventories = await StoreInventory.findAll({
                    attributes: [
                        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                    ],
                    where: {store_id: storeId}
                })
                const totalBatch = Math.ceil(totalInventories/amountCountedPerProcess)
            }
        } catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = CountInventoriesJob