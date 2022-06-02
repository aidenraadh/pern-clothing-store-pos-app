const Job                = require('./Job')
const models             = require('../models/index')
const sequelize          = require("sequelize")
const InventorySize      = models.InventorySize
const StoreInventory     = models.StoreInventory
const StoreInventorySize = models.StoreInventorySize

class SumProductionPriceJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'SumProductionPriceJob'
        } catch (error) {
            throw new Error(error)
        }
        this.process = async (payload = null) => {
            try {
                // Set the job default result
                const thisJob = await this.getJob()
                thisJob.result = JSON.stringify({
                    storeId: parseInt(payload.storeId),
                    storeName: payload.storeName,
                    sum: 0
                })
                await thisJob.save()
                const processedRowsPerBatch = 400
                const totalStoreInvSizes = await StoreInventorySize.findAll({
                    attributes: [
                        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                    ],
                    where: sequelize.literal(`EXISTS (SELECT id FROM ${StoreInventory.tableName} WHERE store_id=${payload.storeId} LIMIT 1)`)
                })
                const totalBatches = Math.ceil(
                    parseInt(totalStoreInvSizes[0].dataValues.total) / processedRowsPerBatch
                )  
                const sumProdPriceBatches = []                                                  
                for (let batch = 1; batch <= totalBatches; ++batch) {
                    sumProdPriceBatches.push(async () => {
                        const currentJob = await this.getJob()

                        const sumProdPrices = await models.sequelize.query(
                            `SELECT SUM("amount" * "production_price") as sum FROM ( `+
                            `SELECT "${StoreInventorySize.tableName}"."amount", "${InventorySize.tableName}"."production_price" `+
                            `FROM "${StoreInventorySize.tableName}" `+
                            `INNER JOIN "${StoreInventory.tableName}" `+
                            `ON "${StoreInventory.tableName}"."id"="${StoreInventorySize.tableName}"."store_inventory_id" `+
                            `AND ("${StoreInventory.tableName}"."deleted_at" IS NULL AND "${StoreInventory.tableName}"."store_id"=${payload.storeId}) `+
                            `INNER JOIN "${InventorySize.tableName}" `+
                            `ON "${InventorySize.tableName}"."id"="${StoreInventorySize.tableName}"."inventory_size_id" AND`+
                            `("${InventorySize.tableName}"."deleted_at" IS NULL) `+
                            `LIMIT ${processedRowsPerBatch} OFFSET ${(batch - 1) * processedRowsPerBatch}`+
                            `) AS subquery`
                        );
                        const sum = sumProdPrices[0][0] && sumProdPrices[0][0].sum ? parseInt(sumProdPrices[0][0].sum) : 0
                        currentJob.result = JSON.parse(currentJob.result)
                        currentJob.result = {
                            ...currentJob.result,
                            sum: currentJob.result.sum + sum
                        }
                        currentJob.result = JSON.stringify(currentJob.result)
                        await currentJob.save()  
                        return Promise.resolve()
                    })
                }    
                const startSum = (prev, curr) => {
                    return prev.then(curr)
                }
                await sumProdPriceBatches.reduce(startSum, Promise.resolve())
                    .then(result => { })
                    .catch(error => { throw error })                             
            } catch (error) {
                throw new Error(error)
            }
        }         
    }
}

module.exports = SumProductionPriceJob