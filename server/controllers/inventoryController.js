const models                   = require('../models/index')
const Inventory                = models.Inventory
const InventorySize            = models.InventorySize
const Sequelize                = require("sequelize")
const {Op}                     = require("sequelize")
const Joi                      = require('joi')
const filterKeys               = require('../utils/filterKeys')
const logger                   = require('../utils/logger')
const storeInventoryController = require('./storeInventoryController')

exports.index = async (req, res) => {    
    try {
        // Set filters
        const filters = {
            where: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){ filters.where.name = value }  
        }
        const inventories = await Inventory.findAll({
            where: (() => {
                const where = {...filters.where, owner_id: req.user.owner_id}
                if(where.name){ where.name =  {[Op.iLike]: `%${where.name}%`}}
                return where
            })(),
            include: [{
                model: InventorySize, as: 'sizes', 
                attributes: ['id', 'name', 'production_price', 'selling_price']
            }],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            inventories: inventories,
            filters: {...filters.where, ...filters.limitOffset}
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
            req.body, ['name', 'inventory_sizes']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Store the inventory
        const inventory = await Inventory.create({
            name: values.name, owner_id: req.user.owner_id
        })
        // Store the inventory sizes
        await InventorySize.bulkCreate(
            values.inventory_sizes.map(size => ({
                name: size.name, inventory_id: inventory.id,
                production_price: size.production_price,
                selling_price: size.selling_price,
            }))
        )
        // Get the inventory's sizes
        const sizes = await inventory.getSizes({
            attributes: ['id', 'name', 'production_price', 'selling_price']
        })
        res.send({
            inventory: {...inventory.toJSON(), sizes: sizes}, 
            message: 'Success storing inventory'
        })  
    } catch(err) {
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try {
        // Make sure the inventory is exists
        if(!await isInventoryExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Inventory is not exist'})
        }        
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['name', 'inventory_sizes']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }        
        // Update the inventory
        const inventory = await Inventory.findOne({where: {id: req.params.id}})
        inventory.name = values.name
        await inventory.save()
        
        // Get all existed sizes
        let existedSizes = await InventorySize.findAll({
            attributes: ['id', 'name', 'production_price', 'selling_price'],
            where: {inventory_id: req.params.id}
        })
        // Delete the sizes if there are any
        let inpSizeIds = values.inventory_sizes.map(size => parseInt(size.id))      
        await InventorySize.destroy({
            where: {
                id: existedSizes
                    .filter(size => !inpSizeIds.includes(parseInt(size.id)))
                    .map(size => size.id)
            }
        })
        // Update the sizes if there are any
        for(const size of existedSizes){
            for(const inpSize of values.inventory_sizes){
                if(
                    size.id == inpSize.id &&
                    (
                        size.name != inpSize.name ||
                        size.production_price != inpSize.production_price ||
                        size.selling_price != inpSize.selling_price
                    )
                ){
                    await InventorySize.update(
                        {
                            name: inpSize.name, 
                            production_price: inpSize.production_price, 
                            selling_price: inpSize.selling_price
                        }, 
                        {where: {id: size.id}}
                    )
                }                
            }
        }
        // Insert new sizes if there are any
        const newSizes = values.inventory_sizes
            .filter(size => size.id === undefined)
            .map(size => ({
                ...size, inventory_id: req.params.id,             
            }))
            
        await InventorySize.bulkCreate(newSizes)
        // Refresh the store inventory
        await storeInventoryController.refreshStoreInventory(inventory.id, 'inventory')

        // Get the inventory's sizes
        const sizes = await inventory.getSizes({
            attributes: ['id', 'name', 'production_price', 'selling_price'],
        })    
        res.send({
            inventory: {...inventory.toJSON(), sizes: sizes},
            message: 'Success updating inventory'
        })
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

exports.destroy = async (req, res) => {
    try{
        // Make sure the inventory is exist
        if(!await isInventoryExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Inventory is not exist'})
        }
        await Inventory.destroy({where: {id: req.params.id}})

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
        // Parse the inventory sizes if it exists in the input
        if(input.inventory_sizes){
            input.inventory_sizes = JSON.parse(input.inventory_sizes)
        }
        const rules = {
            // Make sure the inventory name is unique
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {owner_id: req.user.id}
                ]                
                // When the inventory is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const inventory = await Inventory.findOne({
                    where: filters, attributes: ['id']
                })
                if(inventory){
                    throw {message: 'The inventory name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The inventory name must below 100 characters',
            }),

            // Make sure the size name of the inventory is unique
            inventory_sizes: Joi.array().required().items(Joi.object({
                id: Joi.number().integer(),
                name: Joi.string().required().trim().max(100),
                production_price: Joi.number().required().integer().allow('', null),
                selling_price: Joi.number().required().integer().allow('', null)
            })).external(async (value, helpers) => {
                let sizeNames = []
                value.forEach((size, key) => {
                    // Make sure the size name is unique
                    if(sizeNames.includes(size.name)){
                        throw {message: `There are duplicate size with name ${size.name}`}
                    }
                    // Save the size name
                    sizeNames.push(size.name)
                    // If the production price is not numeric, set it to null
                    value[key].production_price = (
                        value[key].production_price !== 0 && !value[key].production_price ? 
                        null : value[key].production_price
                    )
                    // If the selling price is not numeric, set it to null
                    value[key].selling_price = (
                        value[key].selling_price !== 0 && !value[key].selling_price ? 
                        null : value[key].selling_price
                    )                    
                })
                return value
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
 * @param {integer} inventoryId 
 * @param {integer} ownerId 
 * @returns {boolean}
 */

const isInventoryExist = async (inventoryId, ownerId) => {
    try {
        const {error} = Joi.number().integer().validate(inventoryId)
        if(error){
            return false
        }
        return await Inventory.findOne({
            attributes: ['id'],
            where: {id: inventoryId, owner_id: ownerId}, 
        }) ? true : false            
    } catch (err) {
        logger.error(err.message)
        return false
    }
}
