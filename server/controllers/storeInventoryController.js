const models             = require('../models/index')
const Inventory          = models.Inventory
const InventorySize      = models.InventorySize
const StoreInventory     = models.StoreInventory
const StoreInventorySize = models.StoreInventorySize
const Store              = models.Store
const {Op}               = require("sequelize")
const Joi                = require('joi')
const filterKeys         = require('../utils/filterKeys')
const logger             = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        const userRole = req.user.role.name.toLowerCase()
        // Set filters
        const filters = {
            whereStoreInv: {},
            whereInv: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        if(req.query.store_id && userRole !== 'employee'){
            const {value, error} = Joi.number().required().integer().validate(req.query.store_id)
            if(error === undefined){ filters.whereStoreInv.store_id = value }            
        }
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){ filters.whereInv.name = value }
        }     
        const storeInvs = await StoreInventory.findAll({
            where: (() => {
                const where = {...filters.whereStoreInv}
                // When user is employee, the store ID must be the store where they employed
                if(userRole === 'employee'){ where.store_id = req.user.storeEmployee.store_id }
                return where
            })(),
            attributes: ['id', 'total_amount', 'created_at'],
            include: [
                {
                    model: StoreInventorySize, as: 'sizes', 
                    attributes: ['id', 'inventory_size_id', 'amount'],
                },
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name', 'type_id'],
                    where: {owner_id: req.user.owner_id}
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id', 'name'],
                    where: (() => {
                        let where = {...filters.whereInv, owner_id: req.user.owner_id}
                        if(where.name){ where.name = {[Op.iLike]: `%${where.name}%`} }
                        return where
                    })(),
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: (() => {
                            const attr = ['id', 'name', 'selling_price']
                            // When user is owner, get also the production price
                            if(userRole === 'owner'){ attr.push('production_price') }
                            return attr
                        })()                       
                    }]
                },                          
            ],        
            order: [['created_at', 'DESC']],
            ...filters.limitOffset
        })

        res.send({
            storeInvs: storeInvs, 
            filters: {
                ...filters.whereStoreInv,
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
    try {
        // Get all the required data to store new store inventories
        res.send({
            stores: await Store.findAll({
                attributes: ['id', 'name'],
                where: {owner_id: req.user.owner_id}
            })
        })
    } catch (error) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.store = async (req, res) => {    
    try {
        const userRole = req.user.role.name.toLowerCase()
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['store_id', 'stored_invs']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        
        // Store the inventories to the store
        let storeInvs = await StoreInventory.bulkCreate(values.stored_invs.storedInvs.map(inv => ({
            store_id: values.store_id, inventory_id: inv.id, 
            total_amount: inv.total_amount
        })))
        // Store the inventory sizes to the store
        const storeInvSizes = []

        values.stored_invs.storedInvs.forEach(inv => {
            inv.sizes.forEach(size => {
                storeInvSizes.push({
                    store_inventory_id: storeInvs.find(storeInv => (
                        parseInt(inv.id) === parseInt(storeInv.inventory_id)
                    )).id,
                    inventory_size_id: size.id,
                    amount: size.amount
                })
            })
        })
        // Create the store inventory sizes
        await StoreInventorySize.bulkCreate(storeInvSizes)

        storeInvs = await StoreInventory.findAll({
            where: {id: storeInvs.map(storeInv => storeInv.id)},
            attributes: ['id', 'total_amount', 'created_at'],
            include: [
                {
                    model: StoreInventorySize, as: 'sizes', 
                    attributes: ['id', 'inventory_size_id', 'amount'],
                },
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
                        attributes: (() => {
                            const attr = ['id', 'name', 'selling_price']
                            // When user is owner, get also the production price
                            if(userRole === 'owner'){ attr.push('production_price') }
                            return attr
                        })()                       
                    }]
                },                          
            ],        
            order: [['created_at', 'DESC']],
        })        
        res.status(200).send({
            storeInvs: storeInvs,
            alrStoredInvs: values.stored_invs.alrStoredInvs,
            message: 'Success updating the stored inventory'
        })      
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.update = async (req, res) => {
    try {
        const userRole = req.user.role.name.toLowerCase()
        // Get the store inventory
        const storeInv = await getStoreInventory(req.params.id, req.user.owner_id)
        // Make sure the inventory stored is exists
        if(!storeInv){
            return res.status(400).send({message: "The store's inventory is not exist"})
        }              
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['updatedSizes']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Delete the deleted store inventory size
        if(values.updatedSizes.deleted.length){
            await StoreInventorySize.destroy({
                where: {id: values.updatedSizes.deleted.map(size => size.id)}
            })            
        }
        // Update the updated store inventory size
        for (const size of values.updatedSizes.updated) {
            await StoreInventorySize.update(
                {amount: size.amount},
                {where: {id: size.id}}
            )
        }
        // Add the added store inventory size
        if(values.updatedSizes.added.length){
            await StoreInventorySize.bulkCreate(
                values.updatedSizes.added.map(size => ({
                    store_inventory_id: storeInv.id,
                    inventory_id: storeInv.inventory_id,
                    inventory_size_id: size.inventory_size_id,
                    amount: size.amount
                }))
            )
        }        
        // Refresh the store inventory
        await refreshStoreInventory(req.params.id, 'storeinventory')
     
        res.send({
            storeInv: await getStoreInventory(req.params.id, req.user.owner_id),
            message: 'Success updating the stored inventory'
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

exports.destroy = async (req, res) => {
    try{
        const storeInv = await getStoreInventory(req.params.id, req.user.ownerId)
        // Make sure the inventory stored is exist
        if(!storeInv){
            return res.status(400).send({message: "The store's inventory is not exist"})
        }
        await storeInv.destroy()

        res.send({message: 'Success deleting inventory'})        
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

exports.refreshStoreInventory = async (ids, model, removeDeletedSize = true) => {
    try {
        await refreshStoreInventory(ids, model, removeDeletedSize)   
    } catch (err) {
        throw err
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
            store_id: Joi.number().required().integer().external(async (value, helpers) => {
                const store = await Store.findOne({
                    where: {id: value, owner_id: req.user.owner_id}
                })
                if(!store){
                    throw {message: 'The store is not exist'}
                }
                return value
            }),
            stored_invs: Joi.array().required().items(Joi.object({
                id: Joi.number().required().integer(),

                sizes: Joi.array().required().items(Joi.object({
                    id: Joi.number().required().integer(),
                    amount: Joi.number().required().integer().allow('', null),
                }).unknown(true)),

            }).unknown(true)).external(async (value, helpers) => {
                const invIds = value.map(inv => inv.id)
                /* ------ Make sure there are no duplicate inventories ------ */

                // Get all the duplicated inventory ID
                const duplicated = invIds.filter((id, index, idArr) => (
                    idArr.indexOf(id, (index+1)) !== -1
                ))
                if(duplicated.length){
                    throw {message: 'There are duplicate inventories'}
                }
                /* ------------------------------------------------------------ */
                
                /* ------ Remove all the inventories that already stored  ------ */

                // Get all the inventory that already stored
                const alrStoredInvs = await StoreInventory.findAll({
                    where: {inventory_id: invIds, store_id: input.store_id},
                    attributes: ['inventory_id'],
                    include: [{
                        model: Inventory, as: 'inventory', 
                        attributes: ['name'],
                    }]
                })
                const alrStoredInvIds = alrStoredInvs.map(inv => parseInt(inv.inventory_id))
                // Filter the inventories
                const storedInvs = value.filter(inv => (
                    !alrStoredInvIds.includes(parseInt(inv.id))
                ))
                /* ------------------------------------------------------------ */


                /* ------------ Make sure the stored size is exists  ------------ */

                // Get all the inventory and its sizes
                const invAndSizes = await Inventory.findAll({
                    where: {id: storedInvs.map(inv => inv.id)},
                    attributes: ['id'],
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id']                        
                    }]
                })
                storedInvs.forEach((storedInv, index, self) => {
                    let totalAmount = 0
                    const sanitizedSizes = []
                    const sizeIds = invAndSizes.find(invAndSize => (
                        parseInt(invAndSize.id) === parseInt(storedInv.id)
                    ))
                    .sizes.map(size => parseInt(size.id))

                    storedInv.sizes.forEach(size => {
                        if(sizeIds.includes(parseInt(size.id)) && size.amount){
                            sanitizedSizes.push(size)
                            totalAmount += size.amount
                        }
                    })
                    self[index].sizes = sanitizedSizes
                    self[index].total_amount = totalAmount ? totalAmount : null
                })
                /* ------------------------------------------------------------ */
                return {
                    storedInvs: storedInvs, alrStoredInvs: alrStoredInvs
                }
            }),       

            updatedSizes: Joi.array().required().items(Joi.object({
                id: Joi.number().required().integer().allow('', null),
                inventory_size_id: Joi.number().required().integer(),
                amount: Joi.number().required().integer().allow('', null),
                isChanged: Joi.boolean().required()
            }).unknown(true)).external(async (value, helpers) => {
                // Get the store inventory
                const storeInv = await StoreInventory.findOne({
                    attributes: ['inventory_id'],
                    where: {id: req.params.id}
                })
                // Get all the inventory sizes
                const invSizes = await InventorySize.findAll({
                    attributes: ['id'],
                    where: {inventory_id: storeInv.inventory_id}
                })
                const filteredSizes = {
                    added: [], updated: [], deleted: []
                }
                // Loop through the updated sizes
                value.forEach(size => {
                    // Check if the updated size is exist inside inventory sizes,
                    // and the size's amount is changed
                    const isSizeExsit = invSizes.find(invSize => (
                        parseInt(invSize.id) === parseInt(size.inventory_size_id)
                    ))
                    if(isSizeExsit && size.isChanged){
                        // When the store inventory size ID is not set, and the amount is not 0 or ''
                        // means the size is newly added
                        if(size.id === '' && (size.amount !== 0 || size.amount !== '')){
                            filteredSizes.added.push({...size})
                        } 
                        // When the store inventory size ID is set, and the amount is not 0 and '',
                        // means the size is updated
                        else if(size.id !== '' && (size.amount !== 0 && size.amount !== '')){
                            filteredSizes.updated.push({...size})
                        }
                        // When the store inventory size ID is set, and the amount is 0 or '',
                        // means the size is deleted
                        else if(size.id !== '' && (size.amount === 0 || size.amount === '')){
                            filteredSizes.deleted.push({...size})
                        }
                    }
                })
                console.log(filteredSizes)
                return filteredSizes
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
 * @returns {object|false}
 */

const getStoreInventory = async (id, ownerId) => {
    try {
        const storeInvIdInput = Joi.number().integer().validate(id)

        if(storeInvIdInput.error){
            storeInvIdInput.value = ''
        }
        return await StoreInventory.findOne({
            where: {id: id},
            attributes: ['id', 'total_amount', 'created_at'],
            include: [
                {
                    model: StoreInventorySize, as: 'sizes', 
                    attributes: ['id', 'inventory_size_id', 'amount'],
                },
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name', 'type_id'],
                    where: {owner_id: ownerId}
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id', 'name'],
                    where: {owner_id: ownerId},
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id', 'name', 'production_price', 'selling_price']                      
                    }]
                },                          
            ],        
        })             
          
    } catch (err) {
        throw err
    }
}

/**
 * Remove all the StoreInventorySize that the size is not exist, and recalculate
 * the total_amount of the StoreInventory
 * @param {array} ids - array of store inventory IDs or inventory IDs 
 * @param {string} model - the model refrensing the 'ids'
 * @param {boolean} removeDeletedSize - whether or not the size that doesnt exist is also removed from store inventory size
 */

const refreshStoreInventory = async (ids, model, removeDeletedSize = true) => {
    try {
        let where = {}
        let paranoid = removeDeletedSize
        switch(model){
            case 'storeinventory':
                where = {id: ids}
                break;
            case 'inventory':
                where = {inventory_id: ids}
                break;            
            default: throw new Error();
        }
        const storeInvs = await StoreInventory.findAll({
            where: where,
            attributes: ['id', 'total_amount'],
            include: [
                {
                    model: StoreInventorySize, as: 'sizes', 
                    attributes: ['id', 'inventory_size_id', 'amount'],
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id'],
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id'],
                        paranoid: paranoid                      
                    }]
                },                          
            ],        
        })       
        for(const storeInv of storeInvs){
            let totalAmount = 0
            let deletedStoreInvSizeIds = []
            // Make sure the size is exist
            for(const storeInvSize of storeInv.sizes){
                const isExists = storeInv.inventory.sizes.find(existedSize => (
                    parseInt(existedSize.id) === parseInt(storeInvSize.inventory_size_id)
                ))
                if(isExists){
                    const amount = storeInvSize.amount ? storeInvSize.amount : 0
                    totalAmount += amount
                    // When the amount is 0, remove it
                    if(amount === 0){ deletedStoreInvSizeIds.push(storeInvSize.id) }
                }
                // When the size is not exist, remove it
                else{
                    deletedStoreInvSizeIds.push(storeInvSize.id)
                }
            }
            // Remove the size that doesnt exist
            await StoreInventorySize.destroy({where: {id: deletedStoreInvSizeIds}})
            // Update the total amount of store inventory
            storeInv.total_amount = totalAmount
            await storeInv.save()
        }          
    } catch (err) {
        throw err     
    }  
}