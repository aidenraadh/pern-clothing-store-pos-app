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
const StoreInventoryController  = require('./StoreInventoryController')
const filterKeys                = require('../utils/filterKeys')
const logger                    = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        const userRole = req.user.role.name.toLowerCase()
        /*--------------- Sanitize queries ---------------*/

        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.from = Joi.date().required().validate(queries.from)
        queries.from = queries.from.error ? '' : queries.from.value        
        queries.to = Joi.date().required().validate(queries.to)
        queries.to = queries.to.error ? '' : queries.to.value          
        queries.name = Joi.string().required().trim().validate(queries.name)
        queries.name = queries.name.error ? '' : queries.name.value
        // When the user is employee, they can only see StoreTransaction from the store they're employed to
        if(userRole === 'employee'){
            queries.store_id = req.user.storeEmployee.store_id
        }
        else{
            queries.store_id = Joi.number().required().integer().validate(queries.store_id)
            queries.store_id = queries.store_id.error ? '' : queries.store_id.value  
        }
        /*-------------------------------------------------*/      

        /*--------------- Set filters ---------------*/

        const filters = {
            whereStoreTrnsc: {},
            whereInv: {},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }
        if(queries.store_id){
            filters.whereStoreTrnsc.store_id = queries.store_id
        }
        if(queries.from){
            filters.whereStoreTrnsc.transaction_date = {[Op.gte]: queries.from}
        }        
        if(queries.to){
            filters.whereStoreTrnsc.transaction_date = {
                ...filters.whereStoreTrnsc.transaction_date,
                [Op.lte]: queries.to
            }
        }          
        if(queries.name){
            filters.whereInv.name = {[Op.iLike]: `%${queries.name}%`} 
        }  
        /*-------------------------------------------------*/   
        
        // Get all regular stores   
        const stores = userRole === 'employee' ? [] : 
        await Store.findAll({
            where: {owner_id: req.user.owner_id, type_id: 1},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        })
        // Get all StoreTransaction
        const storeTrnscs = await StoreTransaction.findAll({
            where: filters.whereStoreTrnsc,
            attributes: ['id', 'total_amount','total_cost','total_original_cost', 'transaction_date'],
            include: [
                // Get the store, even if its soft deleted
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name'],
                    where: {owner_id: req.user.owner_id},
                    paranoid: false,
                    required: true,
                },              
                {
                    model: StoreTransactionInventory, as: 'storeTrnscInvs', 
                    attributes: ['id', 'amount', 'cost', 'original_cost_per_inv'],
                    include: [
                        // Get the inventories, including the soft deleted ones
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],
                            where: filters.whereInv,
                            paranoid: false              
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
            filters: queries
        })          
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.get = async (req, res) => {
    try { 
        res.send({
            storeInv: await getStoreTransaction(req.params.id),
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }      
}

exports.store = async (req, res) => {    
    try {
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['transaction_date', 'purchased_invs']) 
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
            original_cost_per_inv: inv.originalCost
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
        await StoreInventoryController.refreshStoreInventory(storeInvIds, 'storeinventory')

        res.status(200).send({
            message: 'Success storing the transaction'
        })      
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.destroy = async (req, res) => {
    try{
        const storeTrnsc = await getStoreTransaction(req.params.id)
        if(!storeTrnsc){
            return res.status(400).send({message: "The transaction doesn't exist"})
        }
        // Get all purchased inventories ID
        const purchasedInvIds = storeTrnsc.storeTrnscInvs
            .map(inv => parseInt(inv.inventory.id))
            .filter((value, index, self) => (self.indexOf(value) === index))

        for (const invId of purchasedInvIds) {
            // Get the store inventory
            const storeInv = await StoreInventory.findOne({
                where: {inventory_id: invId, store_id: req.user.storeEmployee.store_id},
                attributes: ['id']
            })            
            // Get all the purchased inventories for this inventory
            const purchasedInvs = storeTrnsc.storeTrnscInvs.filter(inv => (
                parseInt(inv.inventory.id) === invId
            ))
            for (const purchasedInv of purchasedInvs) {
                // Update the store inventory size
                const storeInvSize = await StoreInventorySize.findOne({
                    where: {
                        store_inventory_id: storeInv.id,
                        inventory_size_id: purchasedInv.size.id
                    }
                })
                // Return the purchased amount if the store inventory size exists
                if(storeInvSize){
                    const amountStored = storeInvSize.amount ? storeInvSize.amount : 0
                    storeInvSize.amount = amountStored + purchasedInv.amount
                    await storeInvSize.save()
                }     
            }
        }
        // Refresh the store inventory for all purchased inventories
        await StoreInventoryController.refreshStoreInventory(purchasedInvIds, 'inventory')
        // Destroy the store transaction
        await storeTrnsc.destroy()
        
        res.send({message: 'Success removing transaction'})        
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
        // Parse the updated sizes if it exists in the input
        if(input.purchased_invs){
            input.purchased_invs = JSON.parse(input.purchased_invs)
        }      
        const rules = {
            transaction_date: Joi.date().required(),

            purchased_invs: Joi.array().required().items(Joi.object({
                storeInvId: Joi.number().required().integer(),
                storeInvSizeId: Joi.number().required().integer(),
                inventoryName: Joi.string().required(),
                sizeName: Joi.string().required(),
                amount: Joi.number().required().integer().min(0).allow('', null),
                amountLeft: Joi.number().required().integer().allow('', null),
                cost: Joi.number().required().integer().min(0).allow('', null),
                originalAmount: Joi.number().required().integer().min(0).allow('', null),
                originalCost: Joi.number().required().integer().min(0).allow('', null),                

            }).unknown(true)).external(async (value, helpers) => {
                // Get all purchased store inventory IDs
                const storeInvIds = value.map(inv => inv.storeInvId).filter((value, index, self) => (
                    self.indexOf(value) === index
                ))
                // Get all store inventories from the target store
                const storeInvs = await StoreInventory.findAll({
                    where: {
                        id: storeInvIds,
                        store_id: req.user.storeEmployee.store_id
                    },
                    attributes: ['id', 'total_amount'],
                    include: [
                        {
                            model: StoreInventorySize, as: 'sizes', 
                            attributes: ['id', 'inventory_size_id', 'amount'],
                        },
                        {
                            model: Store, as: 'store', 
                            attributes: ['id', 'name'],
                            required: true,
                        },
                        {
                            model: Inventory, as: 'inventory', 
                            attributes: ['id', 'name'],
                            required: true,
                            include: [{
                                model: InventorySize, as: 'sizes',
                                attributes: ['id', 'selling_price']
                            }]
                        },                          
                    ],        
                })
                // Make sure all the purchased inventories is exists inside the store
                if(storeInvIds.length !== storeInvs.length){
                    throw {message: 'One of the inventories is not exist inside the store'}
                }
                const purchasedInvs = value.map(inv => {
                    // Get the StoreInventory
                    const storeInv = storeInvs.find(storeInv => (
                        inv.storeInvId === parseInt(storeInv.id)
                    ))
                    // Get the StoreInventorySize from the target store
                    const storeInvSize = storeInv.sizes.find(storeInvSize => (
                        inv.storeInvSizeId === parseInt(storeInvSize.id)
                    ))
                    // Get the InventorySize
                    const inventorySize = storeInv.inventory.sizes.find(size => (
                        parseInt(size.id) === parseInt(storeInvSize.inventory_size_id)
                    ))
                    // Make sure the size is exist inside the store
                    if(!storeInvSize){
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

                    // Make sure these data below is the most updated ones
                    data.amountLeft = storeInvSize.amount - data.amount
                    data.cost = data.cost * data.amount
                    data.originalCost = inventorySize.selling_price    
                    
                    // Make sure the amount size purchased does not exceed
                    if(data.amountLeft < 0){
                        throw {message: 
                            `The amount of inventory '${inv.inventoryName}' size '${inv.sizeName}' `+
                            `exceeds`
                        }
                    }                    

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
 * @param {integer} id 
 * @param {integer} inventoryId 
 * @returns {object}
 */

const getStoreTransaction = async (id, paranoid = true) => {
    try {
        const storeTrnscIdInput = Joi.number().integer().validate(id)
        if(storeTrnscIdInput.error){
            storeTrnscIdInput.value = ''
        }
        return await StoreTransaction.findOne({
            where: {id: storeTrnscIdInput.value},
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
                    attributes: ['id', 'amount', 'cost', 'original_cost_per_inv'],
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
        throw err
    }
}
/**
 * 
 * @param {array} invs 
 * @returns {object}
 */
const countTotalAmountAndCost = (invs) => {
    try {
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
    } catch (err) {
        throw err
    }
}