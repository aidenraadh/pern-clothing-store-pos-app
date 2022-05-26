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
module.exports = CountInventoriesJob