const models                    = require('../models/index')
const StoreTransaction          = models.StoreTransaction
const StoreTransactionInventory = models.StoreTransactionInventory
const Inventory                 = models.Inventory
const InventorySize             = models.InventorySize
const StoreInventory            = models.StoreInventory
const StoreInventorySize        = models.StoreInventorySize
const Store                     = models.Store
const {Op}                      = require("sequelize")
const Joi                       = require('joi')
const filterKeys                = require('../utils/filterKeys')
const logger                    = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        const userRole = req.user.role.name.toLowerCase()
        // Set filters
        const filters = {
            whereStoreTrnsc: {},
            whereInv: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        if(req.query.store_id && userRole !== 'employee'){
            const {value, error} = Joi.number().required().integer().validate(req.query.store_id)
            if(error === undefined){ filters.whereStoreTrnsc.store_id = value }            
        }
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){ filters.whereInv.name = value }
        }     
        // Get all the stores   
        const stores = userRole === 'employee' ? [] : 
        await Store.findAll({
            where: {owner_id: req.user.owner_id},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        })
        const storeTrnscs = await StoreTransaction.findAll({
            where: (() => {
                const where = {...filters.whereStoreTrnsc}
                // When user is employee, the store ID must be the store where they employed
                if(userRole === 'employee'){ where.store_id = req.user.storeEmployee.store_id }
                return where
            })(),
            attributes: ['id', 'total_amount','total_cost','total_original_cost', 'transaction_date'],
            include: [
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                    where: {owner_id: req.user.owner_id}
                },              
                {
                    model: StoreTransactionInventory, as: 'storeTrnscInvs', 
                    attributes: ['id', 'amount', 'cost', 'original_cost'],
                    include: [
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],
                            where: (() => {
                                let where = {...filters.whereInv}
                                if(where.name){ where.name = {[Op.iLike]: `%${where.name}%`} }
                                return where
                            })(),                            
                        },
                        {
                            model: InventorySize, as: 'size', 
                            attributes: ['id', 'name'],                             
                        }
                    ],
                },                        
            ],        
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })

        res.send({
            storeTrnscs: storeTrnscs, 
            stores: stores,
            filters: {
                ...filters.whereStoreTrnsc,
                ...filters.whereInv,
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
            req.body, ['purchased_invs']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
          
        res.status(200).send({
            data: values,
            message: 'Success storing the transaction'
        })      
    } catch(err) {
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try {
        // Get the store inventory
        let storeInv = await isStoreInventoryExist(req.params.id, req.user.owner_id)
        // Make sure the inventory stored is exists
        if(!storeInv)
        {
            return res.status(400).send({
                message: "The store's inventory is not exist"
            })
        }              
        // Validate the input
        const {values, errMsg} = await validateInput(req, {
            updated_sizes: req.body.updated_sizes
        }) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Get all the inventory sizes ids
        let currentSizeIds = await InventorySize.findAll({
            where: {inventory_id: storeInv.inventory_id},
            attributes: ['id'],
        })
        currentSizeIds = currentSizeIds.map(size => parseInt(size.id))
    
        const addedSizes = []
        const updatedSizes = []
        const removedSizes = []        
        // Loop through updated inventory sizes
        values.updated_sizes.forEach(size => {
            if(currentSizeIds.includes(parseInt( size.inventory_size_id )) && size.isChanged){
                // When id is empty string and there are amount stored
                if(size.id === '' && size.amount){
                    addedSizes.push(size)
                }
                // When id is not empty string and there are amount stored
                else if(size.id !== '' && size.amount){
                    updatedSizes.push(size)
                }
                // When id is not empty string and there are no amount stored
                else if(size.id !== '' && !size.amount){
                    removedSizes.push(size)
                }
            }
        })           
        // Remove the size that doesn't already exists
        await StoreInventorySize.destroy({
            where: {
                store_inventory_id: req.params.id,
                inventory_size_id: {[Op.notIn]: currentSizeIds}
            }
        })
        // Delete the stored size if there are any
        await StoreInventorySize.destroy({
            where: {
                id: removedSizes.map(size => size.id)
            }
        })        
        // Update the stored size if there are any
        for(const size of updatedSizes){
            await StoreInventorySize.update(
                {amount: size.amount}, 
                {where: {id: size.id}}
            )            
        }        
        // Store the stored size if there are any
        await StoreInventorySize.bulkCreate(addedSizes.map(size => ({
            store_inventory_id: req.params.id, 
            inventory_size_id: size.inventory_size_id, 
            amount: size.amount
        }))) 
        // Count total amount of the stored inventory
        const total_amount = await StoreInventorySize.sum('amount', {
            where: {store_inventory_id: req.params.id}
        })        
        // Update the store inventory
        await StoreInventory.update(
            {total_amount: total_amount ? total_amount : null}, 
            {where: { id: req.params.id }}
        )          
        storeInv = await StoreInventory.findOne({
            where: {id: req.params.id},
            include: [
                {
                    model: StoreInventorySize, as: 'sizes', 
                    attributes: ['id', 'inventory_size_id', 'amount'],
                },
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id', 'name'],
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id', 'name', 'production_price', 'selling_price']                        
                    }]
                },                          
            ],        
            order: [['created_at', 'DESC']],
        })       
        res.send({
            storeInv: storeInv,
            message: 'Success updating the stored inventory'
        })
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
        // Parse the updated sizes if it exists in the input
        if(input.purchased_invs){
            input.purchased_invs = JSON.parse(input.purchased_invs)
        }      
        const rules = {

            purchased_invs: Joi.array().required().items(Joi.object({
                storeInvId: Joi.number().required().integer(),
                totalAmount: Joi.number().required().integer(),
                inventoryId: Joi.number().required().integer(),
                inventoryName: Joi.string().required(),

                store: Joi.object({
                    id: Joi.number().required().integer(),
                    name: Joi.string().required(),
                }).unknown(true),

                purchasedSizes: Joi.array().required().items(Joi.object({
                    storeInvSizeId: Joi.number().required().integer(),
                    sizeId: Joi.number().required().integer(),
                    sizeName: Joi.string().required(),
                    amount: Joi.number().required().integer().min(0).allow('', null),
                    amountLeft: Joi.number().required().integer().min(0).allow('', null),
                    amountStored: Joi.number().required().integer().min(0).allow('', null),
                    cost: Joi.number().required().integer().min(0).allow('', null),
                    originalAmount: Joi.number().required().integer().min(0).allow('', null),
                    originalCost: Joi.number().required().integer().min(0).allow('', null),
                }).unknown(true))

            }).unknown(true)).external(async (value, helpers) => {
                // Get all purchased inventories ID
                const purchasedInvIds = value.map(inv => inv.inventoryId)
                // Get all store inventories from the target store
                const storeInvs = await StoreInventory.findAll({
                    where: {
                        id: purchasedInvIds,
                        store_id: req.user.storeEmployee.store_id
                    },
                    attributes: ['id', 'inventory_id', 'total_amount'],
                    include: [
                        {
                            model: StoreInventorySize, as: 'sizes', 
                            attributes: ['id', 'inventory_size_id', 'amount'],
                        },
                        {
                            model: Store, as: 'store', 
                            attributes: ['id', 'name'],
                        },
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],
                            include: [{
                                model: InventorySize, as: 'sizes', 
                                attributes: ['id', 'name', 'selling_price']                   
                            }]
                        },                          
                    ],        
                })
                // Make sure all the purchased inventories is exists inside the store
                if(purchasedInvIds.length !== storeInvs.length){
                    throw {message: 'One of the inventories is not exist inside the store'}
                }
                const purchasedSizes = value.map(inventory => {
                    // Get the store inventory
                    const storeInv = storeInvs.find(storeInv => (
                        parseInt(inventory.inventoryId) === parseInt(storeInv.inventory_id)
                    ))
                    return {
                        storeInvId: storeInv.id,
                        inventoryId: inventory.inventoryId,
                        purchasedSizes: inventory.purchasedSizes.map(purchasedSize => {
                            // Get the inventory size
                            const invSize = storeInv.inventory.sizes.find(existedSize => (
                                parseInt(purchasedSize.sizeId) === parseInt(existedSize.id)
                            ))
                            // Make sure the size is exist
                            if(!invSize){
                                throw {message: 
                                    `Inventory '${inventory.inventoryName}' size '${purchasedSize.name}' is not exist`
                                }
                            }
                            // Get the inventory size from the target store
                            const storedInvSize = storeInv.sizes.find(storedSize => (
                                parseInt(purchasedSize.sizeId) === parseInt(storedSize.inventory_size_id)
                            ))
                            // Make sure the size is exist inside the store
                            if(!storedInvSize){
                                throw {message: 
                                    `Inventory '${inventory.inventoryName}' size '${purchasedSize.name}' is not exist `+
                                    `inside the store`
                                }
                            }
                            const data = {
                                storeInvSizeId: storedInvSize.id,
                                sizeId: storedInvSize.inventory_size_id,
                                amountLeft: (storedInvSize.amount - purchasedInvIds.amount),
                                originalCost: invSize.selling_price,                           
                            }
                            // Make sure the amount purchased is not exceeds the amount stored
                            if(amountLeft < 0){
                                throw {message: 
                                    `The amount of Inventory '${inventory.inventoryName}' size '${purchasedSize.name}' `+
                                    `is exceeds the amount stored`
                                }                                
                            }
                            return data
                        })
                    }
                })
                return purchasedSizes
            }),       
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
 * @returns {object|false}
 */

const isStoreInventoryExist = async (id, ownerId) => {
    try {
        const {error} = Joi.number().integer().validate(id)

        if(error){
            return false
        }
        const storeInventory = await StoreInventory.findOne({
            where: {id: id},
            include: [
                {
                    model: Store, as: 'store', 
                    attributes: ['id'],
                    where: {owner_id: ownerId}
                },                       
            ],             
        })       
        // Make sure the store's inventory exists
        if(!storeInventory){
            return false
        }    
        return storeInventory           
    } catch (err) {
        logger.error(err.message)
        return false
    }
}
