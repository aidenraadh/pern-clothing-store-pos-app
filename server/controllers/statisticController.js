const models                   = require('../models/index')
const Inventory                = models.Inventory
const Store                = models.Store
const InventorySize            = models.InventorySize
const StoreInventory           = models.StoreInventory
const SumStoreInventoriesJob   = require('../jobs/SumStoreInventoriesJob.js')
const SumProductionPriceJob    = require('../jobs/SumProductionPriceJob.js')
const sequelize                = require("sequelize")
const logger                   = require('../utils/logger')

exports.countInventories = async (req, res) => {
    try {
        const countedInvs = await Inventory.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
            ],
            where: {owner_id: 1}
        });          
        res.send({
            totalInvs: countedInvs[0],
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.sumStoredInventories = async (req, res) => {
    try {
        const SumStoreInventories = new SumStoreInventoriesJob(req.user.id)

        const jobs = await SumStoreInventories.getAllJobs()

        const stillProcessingJobs = jobs.filter(job => job.status === 1)
        
        if(jobs.length !== 0 && stillProcessingJobs.length !== 0){
            return res.send({
                storedInvs: undefined
            })
        }
        else if(jobs.length !== 0){
            return res.send({
                storedInvs: jobs.map(job => JSON.parse(job.result))
            })            
        }
        const stores = await Store.findAll({
            attributes: ['id', 'name'], where: {owner_id: req.user.owner_id}
        })
        stores.forEach(store => {
            const newJob = new SumStoreInventoriesJob(req.user.id)
            newJob.dispatch({storeId: store.id, storeName: store.name})  
        })
        res.send({
            storedInvs: undefined
        })
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.sumProdPrices = async (req, res) => {
    try {
        const SumProdPrice = new SumProductionPriceJob(req.user.id)

        const jobs = await SumProdPrice.getAllJobs()

        const stillProcessingJobs = jobs.filter(job => job.status === 1)
        
        if(jobs.length !== 0 && stillProcessingJobs.length !== 0){
            return res.send({
                sumProdPrices: undefined
            })
        }
        else if(jobs.length !== 0){
            const sumProdPrices = {
                prodPrices: [],
                total: 0
            }
            jobs.forEach(job => {
                const result = JSON.parse(job.result)
                sumProdPrices.prodPrices.push(result)
                sumProdPrices.total += result.sum
            })
            return res.send({
                sumProdPrices: sumProdPrices
            })
        }
        const stores = await Store.findAll({
            attributes: ['id', 'name'], where: {owner_id: req.user.owner_id}
        })
        stores.forEach(store => {
            const newJob = new SumProductionPriceJob(req.user.id)
            newJob.dispatch({storeId: store.id, storeName: store.name})  
        })
        res.send({
            sumProdPrices: undefined
        })
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}