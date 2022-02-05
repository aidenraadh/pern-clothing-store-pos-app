const models         = require('../models/index')
const Inventory      = models.Inventory
const InventorySize  = models.InventorySize
const StoreInventory = models.StoreInventory
const Store          = models.Store
const Joi            = require('joi')
const filterKeys     = require('../utils/filterKeys')
const logger         = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        // Set limit and offset
        const filters = {
            where: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        if(req.query.store_id){
            const {value, error} = Joi.number().required().integer().validate(req.query.store_id)
            if(error === undefined){
                filters.where.store_id = value
            }            
        }
        const stores = await Store.findAll({
            where: {owner_id: req.user.owner_id},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        })
        const storeInvs = await StoreInventory.findAll({
            where: {...filters.where},
            include: [
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                    where: {owner_id: req.user.owner_id}
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id', 'name'],
                    where: {owner_id: req.user.owner_id},
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id', 'name', 'production_price', 'selling_price']                        
                    }]
                }                
            ],
            order: [['created_at', 'DESC']],
            ...filters.limitOffset
        })

        res.send({
            storeInvs: storeInvs, 
            stores: stores,
            filters: {
                ...filters.where,
                ...filters.limitOffset
            }
        })          

        
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.store = async (req, res) => {    
    try {
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['store_id', 'inventory_id', 'amount']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Make sure the inventory is not stored yet
        if(await isStoreInventoryExist(values.store_id, values.inventory_id))
        {
            return res.status(400).send({
                message: "This inventory is already exist inside the store"
            })
        }           
        // Count total amount of the stored inventory
        values.total_amount = countTotalAmount(values.amount)
        // Store the inventory inside the store
        const storeInventory = await StoreInventory.create(values)

        res.send({
            storeInventory: storeInventory, 
            message: 'Success storing inventory inside the store'
        })  
    } catch(err) {
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try {
        // Make sure the inventory stored is exists
        if(!await isStoreInventoryExist(req.params.storeId, req.params.inventoryId))
        {
            return res.status(400).send({
                message: "The store's inventory is not exist"
            })
        }              
        // Validate the input
        const {values, errMsg} = await validateInput(req, {
            store_id: req.params.storeId, 
            inventory_id: req.params.inventoryId,
            amount: req.body.amount
        }) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }                
        // Count total amount of the stored inventory
        values.total_amount = countTotalAmount(values.amount)
        // Update the inventory
        await StoreInventory.update(
            {amount: values.amount, total_amount: values.total_amount}, 
            {where: {
                store_id: values.store_id, inventory_id: values.inventory_id
            }}
        )   
        res.send({message: 'Success updating the stored inventory'})
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

exports.destroy = async (req, res) => {
    try{
        // Make sure the inventory stored is exist
        if(!await isStoreInventoryExist(req.params.storeId, req.params.inventoryId))
        {
            return res.status(400).send({
                message: "The store's inventory is not exist"
            })
        }
        // Make sure the store and inventory is exist for the owner
        const {values, errMsg} = await validateInput(req, {
            store_id: req.params.storeId, inventory_id: req.params.inventoryId
        }) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }         
        await StoreInventory.destroy({where: {
            store_id: values.store_id, inventory_id: values.inventory_id
        }})

        res.send({message: 'Success deleting inventory'})        
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

/**
 * 
 * @param {object} req - The request body
 * @param {object} input - Key-value pair of the user input
 * @returns {object} - Validated and sanitized input with error message
 */

const validateInput = async (req, input) => {
    try {
        // Parse the inventory amount if it exists in the input
        if(input.amount){
            input.amount = JSON.parse(input.amount)
        }

        const rules = {
            // Make sure the store is exist for this owner
            store_id: Joi.number().required().integer().external(async (value, helpers) => {
                const store = await Store.findOne({
                    where: {id: value, owner_id: req.user.id}, 
                    attributes: ['id']
                })
                if(!store){
                    throw {message: 'The store does not exists'}
                }
                return value
            }),

            // Make sure the inventory is exist for this owner
            inventory_id: Joi.number().required().integer().external(async (value, helpers) => {
                const inventory = await Inventory.findOne({
                    where: {id: value, owner_id: req.user.id}, 
                    attributes: ['id']
                })
                if(!inventory){
                    throw {message: 'The inventory does not exists'}
                }
                return value
            }),

            // Make sure the inventory amount per size is valid
            amount: Joi.array().required().items(Joi.object({
                id: Joi.number().required().integer(),
                amount: Joi.number().required().integer().allow(''),
            })).external(async (value, helpers) => {
                const inventory = await Inventory.findOne({
                    where: {id: req.params.inventoryId, owner_id: req.user.id}, 
                    include: [{model: InventorySize, as: 'sizes', attributes: ['id']}]
                })
                // Filter the inventory amount
                const amount = {}
                inventory.sizes.forEach(size => {   
                    value.forEach(inpSize => {
                        // Make sure the size stored is exist and the amount is not empty string
                        if(size.id == inpSize.id && inpSize.amount !== ''){
                            amount[inpSize.id] = parseInt(inpSize.amount)
                        }
                    })
                })
                // Convert the inventory amount back to JSON and return it
                // if there are any size stored, otherwise return null
                return Object.keys(amount).length ? JSON.stringify(amount) : null
            })            
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
 * @param {integer} inventoryId 
 * @returns {boolean}
 */

const isStoreInventoryExist = async (storeId, inventoryId) => {
    try {
        const {error1} = Joi.number().integer().validate(storeId)
        const {error2} = Joi.number().integer().validate(inventoryId)

        if(error1 || error2){
            return false
        }
        const storeInventory = await StoreInventory.findOne({
            attributes: ['store_id'],
            where: {store_id: storeId, inventory_id: inventoryId},
        })       
        // Make sure the store's inventory exists
        if(!storeInventory){
            return false
        }    
        return true           
    } catch (err) {
        logger.error(err.message)
        return false
    }
}

/**
 * 
 * @param {JSON} amount 
 * @returns {integer}
 */

const countTotalAmount = (amount) => 
{
    let totalAmount = 0
    if(amount === null){ return totalAmount }
    amount = JSON.parse(amount)
    for(const sizeId in amount){
        totalAmount += amount[sizeId]
    }
    return totalAmount
}
