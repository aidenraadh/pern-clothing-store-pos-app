const Inventory      = require('../models/index').Inventory
const InventorySize  = require('../models/index').InventorySize
const {Op}           = require("sequelize")
const Joi            = require('joi')
const filterKeys     = require('../utils/filterKeys')
const logger         = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        const limit = parseInt(req.query.limit)

        const inventories = await Inventory.findAll({
            where: {owner_id: req.user.owner_id},
            order: [['id', 'DESC']],
            limit: limit ? limit : 10
        })
        res.send({inventories: inventories})
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.store = async (req, res) => {    
    try {
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'inventory_sizes']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Store the inventory
        const inventory = await Inventory.create({
            name: values.name, owner_id: req.user.owner_id
        })
        // Store the inventory sizes
        const currentTime = new Date()

        const inventorySizes = await InventorySize.insertBulk(
            values.inventory_sizes.map(size => ({
                name: size.name, inventory_id: inventory.id,
                production_price: size.production_price,
                selling_price: size.selling_price,
                created_at: currentTime, updated_at: currentTime
            }))
        )
        res.send({
            inventory: inventory, message: 'Success storing inventory'
        })  
    } catch(err) {
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try {
        if(!await isInventoryExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Inventory is not exist'})
        }        
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'inventory_sizes']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }        
        await Inventory.update(
            {name: values.name}, 
            {where: {id: req.params.id}}
        )
        // Update inventory sizes
        inventorySizes                                                           
        res.send({message: 'Success updating inventory'})
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

const validateInput = async (req, inpKey) => {
    try {
        // Get all the input
        const input = filterKeys(req.body, inpKey)
        // Parse the inventory sizes
        input.inventory_sizes = JSON.parse(input.inventory_sizes)

        // Validate the input
        const values = await Joi.object({
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = {name: value, owner_id: req.user.id}
                // When the inventory is updated
                if(req.params.id){
                    filters[Op.not] = [{id: req.params.id}]
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

            inventory_sizes: Joi.array().items(Joi.object({
                id: Joi.number().integer(),
                name: Joi.string().max(100),
                production_price: Joi.number().integer(),
                selling_price: Joi.number().integer()                
            })).external(async (value, helpers) => {
                let sizeNames = []
                value.forEach(size => {
                    if(sizeNames.includes(size.name)){
                        throw {message: `There are duplicate size with name ${size.name}`}
                    }
                    sizeNames.push(size.name)
                })
                return value
            })
        }).validateAsync(input)

        return {values: values}
    } catch (err) {
        return {errMsg: err.message}
    }    
}

const isInventoryExist = async (storeId, ownerId) => {
    try {
        const {error} = Joi.number().integer().validate(storeId)
        if(error){
            return false
        }
        return await Inventory.findOne({
            where: {id: storeId, owner_id: ownerId}, 
            attributes: ['id']
        }) ? true : false            
    } catch (err) {
        logger.error(err.message)
        return false
    }
}
