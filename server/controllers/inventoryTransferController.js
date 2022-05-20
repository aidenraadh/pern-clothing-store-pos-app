const Joi                      = require('joi')
const filterKeys               = require('../utils/filterKeys')
const logger                   = require('../utils/logger')
const {Op}                     = require("sequelize")
const storeInventoryController = require('../controllers/storeInventoryController')
const models                   = require('../models/index')
const InventoryTransfer        = models.InventoryTransfer
const InventorySize            = models.InventorySize
const Inventory                = models.Inventory
const Store                    = models.Store
const StoreInventory           = models.StoreInventory
const StoreInventorySize       = models.StoreInventorySize


exports.index = async (req, res) => {    
    try {
        const userRole = req.user.role.name.toLowerCase()

        /*--------------- Sanitize queries ---------------*/

        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.name = Joi.string().required().trim().validate(queries.name)
        queries.name = queries.name.error ? '' : queries.name.value
        // When the user is employee, they can only see InventoryTransfer 
        // from the store they're employed to
        if(userRole === 'employee'){
            queries.origin_store_id = req.user.storeEmployee.origin_store_id
        }
        else{
            queries.origin_store_id = Joi.number().required().integer().validate(queries.origin_store_id)
            queries.origin_store_id = queries.origin_store_id.error ? '' : queries.origin_store_id.value  
        }
        queries.destination_store_id = Joi.number().required().integer().validate(
            queries.destination_store_id
        )
        queries.destination_store_id = (
            queries.destination_store_id.error ? 
            '' : queries.destination_store_id.value   
        )       
        /*-------------------------------------------------*/    
        
        /*--------------- Set the filters ---------------*/
        
        const filters = {
            whereInvTransfer: {},
            whereInv: {owner_id: req.user.owner_id},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }       
        if(queries.origin_store_id){
            filters.whereInvTransfer.origin_store_id = queries.origin_store_id      
        }       
        if(queries.destination_store_id){
            filters.whereInvTransfer.destination_store_id = queries.destination_store_id      
        }           
        if(queries.name){
            filters.whereInv.name = {[Op.iLike]: `%${queries.name}%`}
        }
        /*-------------------------------------------------*/   

        // Get the inventory transfers
        const invTransfers = await InventoryTransfer.findAll({
            attributes: ['amount', 'transfer_date'],
            where: filters.whereInvTransfer,
            include: [
                {
                    model: Inventory, as: 'inventory', attributes: ['id', 'name'],
                    paranoid: false,
                    required: true,
                    where: filters.whereInv,
                },
                {
                    model: InventorySize, as: 'inventorySize', attributes: ['id', 'name'],
                    paranoid: false,
                },          
                {
                    model: Store, as: 'originStore', attributes: ['id', 'name'],
                    paranoid: false,
                },          
                {
                    model: Store, as: 'destinationStore', attributes: ['id', 'name'],
                    paranoid: false,
                },                               
            ],
            order: [['created_at', 'DESC']],
            ...filters.limitOffset            
        })
        // Get the stores
        const stores = await Store.findAll({
            where: {owner_id: req.user.owner_id}
        })
        res.send({
            invTransfers: invTransfers, 
            stores: stores,
            filters: queries
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
        // Validate the input
        const {values, errMsg} = await validateInput(req, [
            'originStoreId', 'destinationStoreId', 'transferDate', 'transferedInvs'
        ]) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }   
        // Get the transferedInvs input
        const transferedInvs = values.transferedInvs
        const allStoreInvIds = [
            ...transferedInvs.origin.allStoreInvIds,
            ...transferedInvs.destination.allStoreInvIds,
        ]
        // Store the inventory transfers
        await InventoryTransfer.bulkCreate(transferedInvs.inventories.map(inventory => ({
            inventory_id: inventory.inventoryId,
            inventory_size_id: inventory.inventorySizeId,
            amount: inventory.amount,
            origin_store_id: values.originStoreId,
            destination_store_id: values.destinationStoreId,
            transfer_date: values.transferDate,
        })))
        // Update the StoreInventorySize for origin store
        for (const storeInvSize of transferedInvs.origin.updatedStoreInvSizes) {
            await StoreInventorySize.update(
                {amount: storeInvSize.amount},
                {where: {id: storeInvSize.storeInvSizeId}}
            )
        }
        // Update the StoreInventorySize for destination store
        for (const storeInvSize of transferedInvs.destination.updatedStoreInvSizes) {
            await StoreInventorySize.update(
                {amount: storeInvSize.amount},
                {where: {id: storeInvSize.storeInvSizeId}}
            )
        }
        // Add the StoreInventorySize for destination store
        await StoreInventorySize.bulkCreate(transferedInvs.destination.newStoreInvSizes.map(storeInvSize => ({
            store_inventory_id: storeInvSize.storeInvId,
            inventory_size_id: storeInvSize.inventorySizeId,
            amount: storeInvSize.amount,
        })))
        // Add the StoreInventory for destination store
        for (const storeInv of transferedInvs.destination.newStoreInvs) {
            const newStoreInv = await StoreInventory.create({
                inventory_id: storeInv.inventoryId,
                store_id: values.destinationStoreId,
            })
            await StoreInventorySize.bulkCreate(storeInv.storeInvSizes.map(storeInvSize => ({
                store_inventory_id: newStoreInv.id,
                inventory_size_id: storeInvSize.inventorySizeId,
                amount: storeInvSize.amount,                
            })))
            // Push the newly created StoreInventory's ID
            allStoreInvIds.push(newStoreInv.id)
        }
        await storeInventoryController.refreshStoreInventory(
            allStoreInvIds, 'storeinventory'
        )
        res.send({
            message: 'Success storing inventory transfer'
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.destroy = async (req, res) => {
    try{
        const invTransfer = await getInventoryTransfer(req.params.id, req.user.owner_id)
        if(!invTransfer){
            return res.status(400).send({message: 'The inventory transfer is not exist'})
        }
        // Get the StoreInventory for this inventory and the origin store
        const storeInv = await StoreInventory.findOne({
            attributes: ['id'],
            where: {
                inventory_id: invTransfer.inventory.id,
                store_id: invTransfer.originStore.id
            }
        })
        // Get the StoreInventorySize for this inventory size and the StoreInventory
        const storeInvSize = await StoreInventorySize.findOne({
            attributes: ['id'],
            where: {
                store_inventory_id: storeInv.id,
                inventory_size_id: invTransfer.inventorySize.id
            }
        })
        // When the StoreInventorySize exists return the amount
        if(storeInvSize){
            storeInvSize.amount = storeInvSize.amount + invTransfer.amount
            await storeInvSize.save()
        }
        // If not, store a new StoreInventorySize
        else{
            await StoreInventorySize.create({
                store_inventory_id: storeInv.id,
                inventory_size_id: invTransfer.inventorySize.id,
                amount: invTransfer.amount
            })
        }
        // Refresh the store inventory
        // Destroy the InventoryTransfer
        await invTransfer.destroy()
        res.status(400).send({message: 'Success deleting inventory transfer'})
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
                // Make sure the destination store is different from origin store
                if(value === parseInt(input['originStoreId'])){
                    throw {message: 'The destination store must be different from origin store'}
                }
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
            transferDate: Joi.date().required(),

            transferedInvs: Joi.array().required().items(Joi.object({
                storeInvId: Joi.number().required().integer(),
                storeInvSizeId: Joi.number().required().integer(),
                inventoryId: Joi.number().required().integer(),
                inventorySizeId: Joi.number().required().integer(),
                inventoryName: Joi.string().required(),
                sizeName: Joi.string().required(),
                amount: Joi.number().required().integer().min(0).allow('', null),
                amountLeft: Joi.number().required().integer().allow('', null),
            }).unknown(true)).external(async (value, helpers) => {
                // Get all storeInvSizeId uniquely
                const unqStoreInvSizeIds = value
                    .map(transferedInv => transferedInv.storeInvSizeId)
                    .filter((value, index, self) => (self.indexOf(value) === index))

                // Make sure storeInvSizeId is unique
                if(value.length !== unqStoreInvSizeIds.length){
                    throw {message: 'There are duplicated size transfered'}
                }
                // Get all storeInvId uniquely
                const unqInvIds = value
                    .map(transferedInv => transferedInv.inventoryId)
                    .filter((value, index, self) => (self.indexOf(value) === index))

                // Start the segmenting the input
                const validatedInvs = {
                    inventories: value,
                    origin: await getOriginStoreInvChanges(
                        value, unqInvIds, input.originStoreId
                    ),
                    destination: await getDestinationStoreInvChanges(
                        value, unqInvIds, input.destinationStoreId
                    )
                }
                if(validatedInvs.origin.error){
                    throw {message: validatedInvs.origin.error}
                }
                return validatedInvs
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

const getOriginStoreInvChanges = async (transferedInvs, invIds, storeId) => {
    try {
        // Get all StoreInventory within the origin store
        const storeInvs = await StoreInventory.findAll({
            attributes: ['id'],
            where: {inventory_id: invIds, store_id: storeId},
            include: [
                {
                    model: Inventory, as: 'inventory',
                    attributes: ['id','name'],
                    required: true, // By doing this, the inventory must be exists
                },
                {
                    model: StoreInventorySize, as: 'sizes',
                    attributes: ['id','inventory_size_id','amount'],
                },                        
            ]
        })
        // Make sure all the transfered inventory is exist
        if(storeInvs.length !== invIds.length){
            return {error: 'One of the transfered inventories have been removed from the origin store'}
        }
        const updatedStoreInvSizes = []
        // Loop through all StoreInventory within the origin store
        storeInvs.forEach(storeInv => {
            // Get all transfered inventories for this StoreInventory
            const filteredTransferedInvs = transferedInvs.filter(transferedInv => (
                transferedInv.storeInvId === parseInt(storeInv.id)
            ))
            filteredTransferedInvs.forEach(transferedInv => {
                // Get the StoreInventorySize
                const storeInvSize = storeInv.sizes.find(storeInvSize => (
                    parseInt(storeInvSize.id) === transferedInv.storeInvSizeId
                ))
                // Make sure the StoreInventorySize exists
                if(!storeInvSize){
                    throw `Inventory '${transferedInv.inventoryName}' size '${transferedInv.sizeName}' is not exist `+
                        `inside the origin store`;
                }
                // Make sure the amount transfered is not 0 or ''
                if(transferedInv.amount === 0 || transferedInv.amount === ''){
                    throw `The amount of Inventory '${transferedInv.inventoryName}' size '${transferedInv.sizeName}' `+
                        `cannot be 0`;
                }
                if((storeInvSize.amount - transferedInv.amount) < 0){
                    throw `The amount of inventory '${transferedInv.inventoryName}' size '${transferedInv.sizeName}' `+
                        `exceeds`
                }
                updatedStoreInvSizes.push({
                    storeInvSizeId: transferedInv.storeInvSizeId,
                    amount: storeInvSize.amount - transferedInv.amount,
                })
            })
        })
        return {
            updatedStoreInvSizes: updatedStoreInvSizes,
            allStoreInvIds: storeInvs.map(storeInv => storeInv.id)
        }        
    } catch (error) {
        throw new Error(error)
    }
}


const getDestinationStoreInvChanges = async (transferedInvs, invIds, storeId) => {
    // Get all StoreInventory within the destination store
    const storeInvs = await StoreInventory.findAll({
        attributes: ['id'],
        where: {inventory_id: invIds, store_id: storeId},
        include: [
            {
                model: Inventory, as: 'inventory',
                attributes: ['id','name'],
                required: true, // By doing this, the inventory must be exists
            },
            {
                model: StoreInventorySize, as: 'sizes',
                attributes: ['id','inventory_size_id','amount'],
            },                        
        ]
    })    

    const updatedStoreInvSizes = []
    const newStoreInvSizes = []
    const newStoreInvs = []
    // Loop through all inventory IDs
    invIds.forEach(invId => {
        // Get all the transfered inventories for this inventory
        const filteredTransferedInvs = transferedInvs.filter(transferedInv => (
            transferedInv.inventoryId === invId
        ))
        // Get the StoreInventory for this inventory
        const storeInv = storeInvs.find(storeInv => (
            parseInt(storeInv.inventory.id) === invId
        ))
        // When the StoreInventory exists
        if(storeInv){
            filteredTransferedInvs.forEach(transferedInv => {
                const storeInvSize = storeInv.sizes.find(storeInvSize => (
                    parseInt(storeInvSize.inventory_size_id) === transferedInv.inventorySizeId
                ))
                // When the StoreInventorySize exists
                if(storeInvSize){
                    updatedStoreInvSizes.push({
                        storeInvSizeId: storeInvSize.id, 
                        amount: storeInvSize.amount + transferedInv.amount
                    })
                }
                // When the StoreInventorySize is not exists
                else{
                    newStoreInvSizes.push({
                        storeInvId: storeInv.id,
                        inventorySizeId: transferedInv.inventorySizeId,
                        amount: transferedInv.amount
                    })
                }   
            })
        }
        // When the StoreInventory is not exists
        else{
            newStoreInvs.push({
                inventoryId: invId,
                storeId: storeId,
                storeInvSizes: filteredTransferedInvs.map(transferedInv => ({
                    inventorySizeId: transferedInv.inventorySizeId,
                    amount: transferedInv.amount
                }))
            })
        }
    })
    return {
        updatedStoreInvSizes: updatedStoreInvSizes,
        newStoreInvSizes: newStoreInvSizes,
        newStoreInvs: newStoreInvs,
        allStoreInvIds: storeInvs.map(storeInv => storeInv.id)
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
                    required: true,
                    paranoid: false,
                },
                {
                    model: InventorySize, as: 'inventorySize', attributes: ['id', 'name'],
                    paranoid: false,
                },          
                {
                    model: Store, as: 'originStore', attributes: ['id', 'name'],
                    paranoid: false,
                },          
                {
                    model: Store, as: 'destinationStore', attributes: ['id', 'name'],
                    paranoid: false,
                },                               
            ],       
        })        
    } catch (err) {
        throw err
    }
}
