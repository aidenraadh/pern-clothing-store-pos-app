const Job = require('./Job')

const sequelize = require('sequelize')
const models = require('../models/index')
const Store = models.Store
const StoreInventory = models.StoreInventory


class SumStoreInventoriesJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'SumStoreInventoriesJob'
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
                const totalInventories = await StoreInventory.findAll({
                    attributes: [
                        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                    ],
                    where: {store_id: payload.storeId}
                })
                const totalBatches = Math.ceil(
                    parseInt(totalInventories[0].dataValues.total) / processedRowsPerBatch
                )  
                const sumStoreInvBatches = []  
                for (let batch = 1; batch <= totalBatches; ++batch) {
                    sumStoreInvBatches.push(async () => {
                        const currentJob = await this.getJob()

                        const sumStoreInvs = await models.sequelize.query(
                            `SELECT SUM("total_amount") as sum FROM ( `+
                            `SELECT "${StoreInventory.tableName}"."total_amount" `+
                            `FROM "${StoreInventory.tableName}" WHERE `+
                            `("${StoreInventory.tableName}"."deleted_at" IS NULL AND store_id=${payload.storeId}) `+
                            `LIMIT ${processedRowsPerBatch} OFFSET ${(batch - 1) * processedRowsPerBatch}`+
                            `) AS subquery`
                        )
                        const sum = sumStoreInvs[0][0] && sumStoreInvs[0][0].sum ? parseInt(sumStoreInvs[0][0].sum) : 0

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
                await sumStoreInvBatches.reduce(startSum, Promise.resolve())
                    .then(result => { })
                    .catch(error => { throw error })                
            } catch (error) {
                throw new Error(error)
            }
        }        
    }
}
module.exports = SumStoreInventoriesJob