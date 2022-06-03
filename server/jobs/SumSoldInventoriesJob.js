const Job              = require('./Job')
const sequelize        = require("sequelize")
const {Op}             = require("sequelize")
const models           = require('../models/index')
const StoreTransaction = models.StoreTransaction

class SumSoldInventoriesJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'SumSoldInventoriesJob'

            this.process = async (payload = null) => {
                // Your process logic here
            }
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
                    sum: 0,
                    from: payload.from,
                    to: payload.to
                })
                await thisJob.save()
                const processedRowsPerBatch = 400

                const where = {store_id: payload.storeId}
                if(payload.from !== '' || payload.to !== ''){
                    where.transaction_date = {}
                    if(payload.from !== ''){ where.transaction_date[Op.gte] = payload.from}
                    if(payload.to !== ''){ where.transaction_date[Op.lte] = payload.to}
                }
                const totalInventories = await StoreTransaction.findAll({
                    attributes: [
                        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                    ],
                    where: where
                })
                const totalBatches = Math.ceil(
                    parseInt(totalInventories[0].dataValues.total) / processedRowsPerBatch
                )  
                const sumSoldInvBatches = []  
                for (let batch = 1; batch <= totalBatches; ++batch) {
                    sumSoldInvBatches.push(async () => {
                        const currentJob = await this.getJob()
                        let timeRange = ''
                        if(payload.from !== ''){
                            timeRange += `"${StoreTransaction.tableName}"."transaction_date" >= '${payload.from}'`
                        }
                        if(payload.to !== ''){
                            timeRange = timeRange !== '' ? `${timeRange} AND ` : ''
                            timeRange += `"${StoreTransaction.tableName}"."transaction_date" <= '${payload.to}'`
                        }
                        const sumSoldInvs = await models.sequelize.query(
                            `SELECT SUM("total_amount") as sum FROM ( `+
                            `SELECT "${StoreTransaction.tableName}"."total_amount" `+
                            `FROM "${StoreTransaction.tableName}" WHERE `+
                            `"${StoreTransaction.tableName}"."deleted_at" IS NULL AND store_id=${payload.storeId} `+
                            (timeRange !== '' ? `AND (${timeRange}) `: '')+
                            `LIMIT ${processedRowsPerBatch} OFFSET ${(batch - 1) * processedRowsPerBatch}`+
                            `) AS subquery`
                        )
                        const sum = sumSoldInvs[0][0] && sumSoldInvs[0][0].sum ? parseInt(sumSoldInvs[0][0].sum) : 0
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
                await sumSoldInvBatches.reduce(startSum, Promise.resolve())
                    .then(result => { })
                    .catch(error => { throw error })                    
            } catch (error) {
                throw new Error(error)
            }
        }         
    }
}

module.exports = SumSoldInventoriesJob