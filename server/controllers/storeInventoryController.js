const models         = require('../models/index')
const StoreInventory = models.StoreInventory
const Store          = models.Store
const Inventory      = models.Inventory
const {Op}           = require("sequelize")
const Joi            = require('joi')
const filterKeys     = require('../utils/filterKeys')
const logger         = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        // Set limit and offset
        const limitOffset = {
            limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
            offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0
        }

    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.store = async (req, res) => {    
    try {
        // Validate the input
        const input = filterKeys(
            req.body, ['store_id', 'inventory_id', 'amount']
            )
        const {values, errMsg} = await validateInput(req, input) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Make sure the inventory is not stored yet
        if(await isStoreInventoryExist(input.store_id, input.inventory_id))
        {
            return res.status(400).send({
                message: "The store's inventory already exist"
            })
        }           
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
        // Validate the input
        const input = filterKeys(
            req.body, ['store_id', 'inventory_id', 'amount']
        )
        const {values, errMsg} = await validateInput(req, input) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Make sure the inventory stored is exists
        if(!await isStoreInventoryExist(req.params.store_id, req.params.inventory_id))
        {
            return res.status(400).send({
                message: "The store's inventory is not exist"
            })
        }                 
        // Update the inventory
        await StoreInventory.update(
            {amount: values.amount}, 
            {where: {
                store_id: input.store_id, inventory_id: input.inventory_id
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
        if(!await isStoreInventoryExist(req.params.store_id, req.params.inventory_id))
        {
            return res.status(400).send({
                message: "The store's inventory is not exist"
            })
        }
        // Validate the input
        const input = filterKeys(req.body, ['store_id', 'inventory_id'])

        const {values, errMsg} = await validateInput(req, input) 

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
                    where: {id: value, owner_id: req.user.id}, 
                    include: ['sizes']
                })
                // Filter the inventory amount
                const amount = {}
                inventory.sizes.forEach(size => {   
                    value.forEach(inpSize => {
                        // Make sure the size stored is exist and the amount is not empty string
                        if(size.id == inpSize.id && inpSize.amount !== ''){
                            amount[inpSize.id] = inpSize.amount
                        }
                    })
                })
                // Convert the invetory amount back to JSON
                return JSON.stringify(amount)
            })            
        }

        // Create the schema based on the input
        const schema = {}
        for(const key in rules){
            if(input.hasOwnPropety(key)){
                schema[key] = rules[key]
            }
        }
        // Validate the input
        const values = await Joi.object(schema).validateAsync(input)

        return {values: values}
    } catch (err) {
        return {errMsg: err.message}
    }    
}

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
