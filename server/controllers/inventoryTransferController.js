const models      = require('../models/index')
const InventoryTransfer      = models.InventoryTransfer
const InventorySize      = models.InventorySize
const Inventory      = models.Inventory
const Store      = models.Store
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        const filters = {
            whereInvTransfer: {},
            whereInv: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }       
        if(req.query.origin_store_id){
            const {value, error} = Joi.number().required().integer().validate(req.query.origin_store_id)
            if(error === undefined){ filters.whereInvTransfer.origin_store_id = value }            
        }       
        if(req.query.destination_store_id){
            const {value, error} = Joi.number().required().integer().validate(req.query.destination_store_id)
            if(error === undefined){ filters.whereInvTransfer.destination_store_id = value }            
        }           
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){ filters.whereInv.name = value }
        }          
        const invTransfers = await InventoryTransfer.findAll({
            attributes: ['amount', 'transfer_date'],
            where: {...filters.whereInvTransfer},
            include: [
                {
                    model: Inventory, as: 'inventory', attributes: ['id', 'name'],
                    where: (() => {
                        let where = {...filters.whereInv, owner_id: req.user.owner_id}
                        if(where.name){ where.name = {[Op.iLike]: `%${where.name}%`} }
                        return where
                    })(),
                },
                {
                    model: InventorySize, as: 'inventorySize', attributes: ['id', 'name'],
                },          
                {
                    model: Store, as: 'originStore', attributes: ['id', 'name'],
                },          
                {
                    model: Store, as: 'destinationStore', attributes: ['id', 'name'],
                },                               
            ],
            order: [['created_at', 'DESC']],
            ...filters.limitOffset            
        })
        res.send({
            invTransfers: invTransfers, 
            filters: {
                ...filters.whereInvTransfer,
                ...filters.whereInv,
                ...filters.limitOffset
            }
        })          
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.create = async (req, res) => {
    const stores = await Store.findAll({
        attributes: ['id', 'name'],
        where: {owner_id: req.user.owner_id}
    })
    try {
        res.send({
            stores: stores
        })          
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
   
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.update = async (req, res) => {
    try{


    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

exports.destroy = async (req, res) => {
    try{
     
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

/**
 * 
 * @param {object} req - The request body
 * @param {object} input - Key-value pair of the user input
 * @returns {object} - Validated and sanitized input with error message
 */

const validateInput = async (req, inputKeys) => {
    try {
        const input = filterKeys(req.body, inputKeys)
        const rules = {  
            originStoreId: Joi.number().required().integer().external(async (value, helpers) => {
                // Make sure the inventory size exists for this inventory
                const originStore = await Store.findOne({
                    attributes: ['id'],
                    where: {id: value, owner_id: req.user.owner_id},
                })
                if(!originStore){
                    throw {message: 'The origin store is not exist'}
                }
                return value
            }),             
            destinationStoreId: Joi.number().required().integer().external(async (value, helpers) => {
                // Make sure the inventory size exists for this inventory
                const destinationStore = await Store.findOne({
                    attributes: ['id'],
                    where: {id: value, owner_id: req.user.owner_id},
                })
                if(!destinationStore){
                    throw {message: 'The destination store is not exist'}
                }
                return value
            }),            
            transactionDate: Joi.date().required(),          
        }
        // Create the schema based on the input key
        const schema = {}
        for(const key in input){
            if(rules.hasOwnProperty(key)){ schema[key] = rules[key] }
        }        
        // Validate the input
        const values = await Joi.object(schema).validateAsync(input)    

        return {values: values}
    } catch (err) {
        return {errMsg: err.message}
    }
}

/**
 * 
 * @param {integer} storeId 
 * @param {integer} ownerId 
 * @returns {object}
 */

const getInventoryTransfer = async (id, ownerId) => {
    try {
        const invTransferInput = Joi.number().integer().validate(id)

        if(invTransferInput.error){
            invTransferInput.value = ''
        }
        return await InventoryTransfer.findOne({
            attributes: ['amount', 'transfer_date'],
            where: {id: id},
            include: [
                {
                    model: Inventory, as: 'inventory', attributes: ['id', 'name'],
                    where: {owner_id: ownerId},
                },
                {
                    model: InventorySize, as: 'inventorySize', attributes: ['id', 'name'],
                },          
                {
                    model: Store, as: 'originStore', attributes: ['id', 'name'],
                },          
                {
                    model: Store, as: 'destinationStore', attributes: ['id', 'name'],
                },                               
            ],       
        })        
    } catch (err) {
        throw err
    }
}
