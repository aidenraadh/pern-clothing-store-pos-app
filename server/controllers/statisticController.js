const models                 = require('../models/index')
const Inventory              = models.Inventory
const Store                  = models.Store
const SumStoreInventoriesJob = require('../jobs/SumStoreInventoriesJob.js')
const SumProductionPriceJob  = require('../jobs/SumProductionPriceJob.js')
const SumRevenueJob          = require('../jobs/SumRevenueJob.js')
const SumSoldInventoriesJob          = require('../jobs/SumSoldInventoriesJob.js')
const sequelize              = require("sequelize")
const Joi                    = require('joi')
const logger                 = require('../utils/logger')

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
            const sumStoredInvs = {
                storedInvs: [],
                total: 0
            }
            jobs.forEach(job => {
                const result = JSON.parse(job.result)
                sumStoredInvs.storedInvs.push(result)
                sumStoredInvs.total += result.sum
            })
            return res.send({
                sumStoredInvs: sumStoredInvs
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

exports.sumRevenue = async (req, res) => {
    try {
        const SumRevenue = new SumRevenueJob(req.user.id)

        const jobs = await SumRevenue.getAllJobs()

        const stillProcessingJobs = jobs.filter(job => job.status === 1)
        
        if(jobs.length !== 0 && stillProcessingJobs.length !== 0){
            return res.send({
                sumRevenue: undefined
            })
        }
        else if(jobs.length !== 0){
            const sumRevenue = {
                storeRevenues: [],
                total: 0,
            }
            jobs.forEach(job => {
                const result = JSON.parse(job.result)
                sumRevenue.storeRevenues.push(result)
                sumRevenue.total += result.sum
            })
            return res.send({
                sumRevenue: sumRevenue
            })
        }
        const queries = {...req.query}
        queries.from = Joi.date().required().validate(queries.from)
        queries.from = queries.from.error ? '' : req.query.from 
        queries.to = Joi.date().required().validate(queries.to)
        queries.to = queries.to.error ? '' : req.query.to
        const stores = await Store.findAll({
            attributes: ['id', 'name'], where: {owner_id: req.user.owner_id, type_id: 1}
        })
        stores.forEach(store => {
            const newJob = new SumRevenueJob(req.user.id)
            newJob.dispatch({
                storeId: store.id, storeName: store.name, from: queries.from, to: queries.to
            })  
        })
        res.send({
            sumRevenue: undefined
        })
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.sumSoldInventories = async (req, res) => {
    try {
        const SumSoldInventories = new SumSoldInventoriesJob(req.user.id)

        const jobs = await SumSoldInventories.getAllJobs()

        const stillProcessingJobs = jobs.filter(job => job.status === 1)
        
        if(jobs.length !== 0 && stillProcessingJobs.length !== 0){
            return res.send({
                sumSoldInvs: undefined
            })
        }
        else if(jobs.length !== 0){
            const sumSoldInvs = {
                stores: [],
                total: 0,
            }
            jobs.forEach(job => {
                const result = JSON.parse(job.result)
                sumSoldInvs.stores.push(result)
                sumSoldInvs.total += result.sum
            })
            return res.send({
                sumSoldInvs: sumSoldInvs
            })
        }
        const queries = {...req.query}
        queries.from = Joi.date().required().validate(queries.from)
        queries.from = queries.from.error ? '' : req.query.from 
        queries.to = Joi.date().required().validate(queries.to)
        queries.to = queries.to.error ? '' : req.query.to  
        const stores = await Store.findAll({
            attributes: ['id', 'name'], where: {owner_id: req.user.owner_id, type_id: 1}
        })
        stores.forEach(store => {
            const newJob = new SumSoldInventoriesJob(req.user.id)
            newJob.dispatch({
                storeId: store.id, storeName: store.name, from: queries.from, to: queries.to
            })  
        })
        res.send({
            sumSoldInvs: undefined
        })
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}