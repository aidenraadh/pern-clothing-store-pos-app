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
const storeInventoryController  = require('./storeInventoryController')
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
                // Get the store, even if its soft deleted
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                    where: {owner_id: req.user.owner_id},
                    paranoid: false,
                },              
                {
                    model: StoreTransactionInventory, as: 'storeTrnscInvs', 
                    attributes: ['id', 'amount', 'cost', 'original_cost'],
                    include: [
                        // Get the inventories, including the soft deleted ones
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],
                            where: (() => {
                                let where = {...filters.whereInv}
                                if(where.name){ where.name = {[Op.iLike]: `%${where.name}%`} }
                                return where
                            })(),                            
                        },
                        // Get all inventory sizes including the soft deleted ones
                        {
                            model: InventorySize, as: 'size', 
                            attributes: ['id', 'name'],
                            paranoid: false                      
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

exports.get = async (req, res) => {
    try { 
        res.send({
            storeInv: await getStoreTransaction(req.params.id),
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
            req.body, ['transaction_date', 'purchased_invs']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        const totalAmountAndCost = countTotalAmountAndCost(values.purchased_invs)
        // Create the store transaction
        const storeTrnsc = await StoreTransaction.create({
            store_id: req.user.storeEmployee.store_id,
            total_amount: totalAmountAndCost.totalAmount,
            total_cost: totalAmountAndCost.totalCost,
            total_original_cost: totalAmountAndCost.totalOriginalCost,
            transaction_date: values.transaction_date,
        })
        // Create the store transaction inventory
        await StoreTransactionInventory.bulkCreate(values.purchased_invs.map(inv => ({
            store_transaction_id: storeTrnsc.id,
            inventory_id: inv.inventoryId,
            inventory_size_id: inv.sizeId,
            amount: inv.amount,
            cost: inv.cost,
            original_cost: inv.originalCost
        })))
        // Update the store inventory size amount
        for(const inv of values.purchased_invs){
            await StoreInventorySize.update(
                {amount: inv.amountLeft},
                {where: { id: inv.storeInvSizeId }}
            )
        }
        // Get all purchased inventories ID
        const storeInvIds = values.purchased_invs.map(inv => inv.storeInvId).filter((value, index, self) => (
            self.indexOf(value) === index
        ))
        // Refresh the store inventory
        await storeInventoryController.refreshStoreInventory(storeInvIds, 'storeinventory')

        res.status(200).send({
            message: 'Success storing the transaction'
        })      
    } catch(err) {
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.destroy = async (req, res) => {
    try{
        const storeTrnsc = await getStoreTransaction(req.params.id)
        console.log(storeTrnsc)
        if(!storeTrnsc){
            return res.status(400).send({message: "This transaction doesn't exist"})
        }
        await storeTrnsc.destroy()
        
        res.send({message: 'Success removing transaction'})        
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
            transaction_date: Joi.date().required(),

            purchased_invs: Joi.array().required().items(Joi.object({
                storeInvId: Joi.number().required().integer(),
                inventoryId: Joi.number().required().integer(),
                inventoryName: Joi.string().required(),
                storeInvSizeId: Joi.number().required().integer(),
                sizeId: Joi.number().required().integer(),
                sizeName: Joi.string().required(),
                amount: Joi.number().required().integer().min(0).allow('', null),
                amountLeft: Joi.number().required().integer().allow('', null),
                amountStored: Joi.number().required().integer().min(0).allow('', null),
                cost: Joi.number().required().integer().min(0).allow('', null),
                originalAmount: Joi.number().required().integer().min(0).allow('', null),
                originalCost: Joi.number().required().integer().min(0).allow('', null),                

                store: Joi.object({
                    id: Joi.number().required().integer(),
                    name: Joi.string().required(),
                }).unknown(true),

            }).unknown(true)).external(async (value, helpers) => {
                // Get all purchased inventories ID
                const purchasedInvIds = value.map(inv => inv.inventoryId).filter((value, index, self) => (
                    self.indexOf(value) === index
                ))
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
                const purchasedInvs = value.map(inv => {
                    const storeInv = storeInvs.find(storeInv => (
                        parseInt(inv.inventoryId) === parseInt(storeInv.id)
                    ))
                    // Get the inventory size
                    const invSize = storeInv.inventory.sizes.find(existedSize => (
                        parseInt(inv.sizeId) === parseInt(existedSize.id)
                    ))
                    // Make sure the size is exist
                    if(!invSize){
                        throw {message: 
                            `Inventory '${inv.inventoryName}' size '${inv.sizeName}' is not exist`
                        }
                    }
                    // Get the inventory size from the target store
                    const storedInvSize = storeInv.sizes.find(storedSize => (
                        parseInt(inv.sizeId) === parseInt(storedSize.inventory_size_id)
                    ))
                    // Make sure the size is exist inside the store
                    if(!storedInvSize){
                        throw {message: 
                            `Inventory '${inv.inventoryName}' size '${inv.sizeName}' is not exist `+
                            `inside the store`
                        }
                    }           
                    if(inv.amount === 0 || inv.amount === ''){
                        throw {message: 
                            `The amount of Inventory '${inv.inventoryName}' size '${inv.sizeName}' `+
                            `cannot be 0`
                        }
                    }                                         
                    const data = {...inv}

                    // Make sure the amount size purchased does not exceed
                    if(data.amountLeft < 0){
                        throw {message: 
                            `The amount of inventory '${inv.inventoryName}' size '${inv.sizeName}' `+
                            `exceeds`
                        }
                    }
                    // Make sure these data below is the most updated ones
                    data.storeInvId = storeInv.id
                    data.storeInvSizeId = storedInvSize.id          
                    data.amountLeft = storedInvSize.amount - data.amount
                    data.cost = data.cost * data.amount
                    data.originalCost = invSize.selling_price          

                    return data
                })
                return purchasedInvs
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
 * @returns {object}
 */

const getStoreTransaction = async (id, paranoid = true) => {
    try {      
        return await StoreTransaction.findOne({
            where: {id: id},
            paranoid: paranoid,
            attributes: ['id', 'total_amount','total_cost','total_original_cost', 'transaction_date'],    
            include: [
                // Get the store, even if its soft deleted
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                    paranoid: false,
                },              
                {
                    model: StoreTransactionInventory, as: 'storeTrnscInvs', 
                    attributes: ['id', 'amount', 'cost', 'original_cost'],
                    include: [
                        // Get the inventories, including the soft deleted ones
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],                        
                        },
                        // Get all inventory sizes including the soft deleted ones
                        {
                            model: InventorySize, as: 'size', 
                            attributes: ['id', 'name'],
                            paranoid: false                      
                        }
                    ],
                },                        
            ],                         
        })
    } catch (err) {
        logger.error(err.message)
        return false
    }
}
/**
 * 
 * @param {array} invs 
 * @returns {object}
 */
const countTotalAmountAndCost = (invs) => {
    const totalAmountAndCost = {
        totalAmount: 0, totalCost: 0,
        totalOriginalCost: 0
    }
    // Count the total amount and cost
    invs.forEach(inv => {
        totalAmountAndCost.totalAmount += inv.amount
        totalAmountAndCost.totalCost += inv.cost
        totalAmountAndCost.totalOriginalCost += inv.originalCost
    })
    return totalAmountAndCost
}