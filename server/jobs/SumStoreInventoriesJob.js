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

                        const sumStoreInvs = await StoreInventory.findAll({
                            attributes: [
                                [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
                            ],
                            where: {store_id: payload.storeId},
                            limit: processedRowsPerBatch, 
                            offest: (batch - 1) * processedRowsPerBatch
                        })
                        currentJob.result = JSON.parse(currentJob.result)
                        currentJob.result = {
                            ...currentJob.result,
                            sum: currentJob.result.sum + parseInt(sumStoreInvs[0].dataValues.amount)
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
/*
    var myAsyncFuncs = [
        async () => {
            const store = await Store.findOne()
            return Promise.resolve(store.name)  
        },
        async (val) => {
            console.log('the val is ', val)
            return Promise.resolve(val)
        },
        async(val) => {
            console.log(x + 1)
            console.log('the val is ', val)
            return Promise.resolve(val)
        },
        async (val) => {
            console.log('the val is ', val)
            return Promise.resolve(val)
        }
    ];

    const calc = (prev, curr) => {
        return prev.then(curr)
    }
    let total = 0
    await myAsyncFuncs.reduce(calc, Promise.resolve())
    .then(result => {
        console.log('RESULT is ' + total)  // prints "RESULT is 7"
    })
    .catch(error => {
        total = 'Error bruuuh'
    })
    console.log('sending result')
*/
module.exports = SumStoreInventoriesJob