const Job              = require('./Job')
const sequelize        = require("sequelize")
const {Op}             = require("sequelize")
const models           = require('../models/index')
const StoreTransaction = models.StoreTransaction

class SumRevenueJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'SumRevenueJob'
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
                const sumRevenueBatches = []  
                for (let batch = 1; batch <= totalBatches; ++batch) {
                    sumRevenueBatches.push(async () => {
                        const currentJob = await this.getJob()
                        let timeRange = ''
                        if(payload.from !== ''){
                            timeRange += `"${StoreTransaction.tableName}"."transaction_date" >= ${payload.from}`
                        }
                        if(payload.to !== ''){
                            timeRange = timeRange !== '' ? ' AND ' : ''
                            timeRange += `"${StoreTransaction.tableName}"."transaction_date" <= ${payload.to}`
                        }
                        const sumRevenue = await models.sequelize.query(
                            `SELECT SUM("total_cost") as sum FROM ( `+
                            `SELECT "${StoreTransaction.tableName}"."total_cost" `+
                            `FROM "${StoreTransaction.tableName}" WHERE `+
                            `"${StoreTransaction.tableName}"."deleted_at" IS NULL AND store_id=${payload.storeId} `+
                            (timeRange !== '' ? `AND (${timeRange})`: '')+
                            `LIMIT ${processedRowsPerBatch} OFFSET ${(batch - 1) * processedRowsPerBatch}`+
                            `) AS subquery`
                        )
                        const sum = sumRevenue[0][0] && sumRevenue[0][0].sum ? parseInt(sumRevenue[0][0].sum) : 0
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
                await sumRevenueBatches.reduce(startSum, Promise.resolve())
                    .then(result => { })
                    .catch(error => { throw error })                  
            } catch (error) {
                throw new Error(error)
            }
        }         
    }
}

module.exports = SumRevenueJob