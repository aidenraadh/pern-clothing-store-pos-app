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
        // Get all the stores   
        const stores = userRole === 'employee' ? [] : 
        await Store.findAll({
            where: {owner_id: req.user.owner_id},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        })
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
                    attributes: ['id', 'name'],
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
            stores: stores,
            filters: {
                ...filters.whereStoreInv,
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
        const userRole = req.user.role.name.toLowerCase()
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['store_id', 'stored_invs']
        )) 
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
        logger.error(err.message)   
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try {
        const userRole = req.user.role.name.toLowerCase()
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
        // Refresh the store inventory
        await refreshStoreInventory(req.params.id, 'storeinventory')

        storeInv = await StoreInventory.findOne({
            where: {id: req.params.id},
            attributes: ['id', 'total_amount', 'created_at'],
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
                        attributes: (() => {
                            const attr = ['id', 'name', 'selling_price']
                            // When user is owner, get also the production price
                            if(userRole === 'owner'){ attr.push('production_price') }
                            return attr
                        })()                       
                    }]
                },                          
            ],        
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

exports.refreshStoreInventory = async (ids, model, removeDeletedSize = true) => {
    await refreshStoreInventory(ids, model, removeDeletedSize)
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
        if(input.updated_sizes){
            input.updated_sizes = JSON.parse(input.updated_sizes)
        }
        // Parse the stored inventories if it exists in the input
        if(input.stored_invs){
            input.stored_invs = JSON.parse(input.stored_invs)
        }        
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

            updated_sizes: Joi.array().required().items(Joi.object({
                id: Joi.number().required().integer().allow('', null),
                inventory_size_id: Joi.number().required().integer(),
                amount: Joi.number().required().integer().allow('', null),
                isChanged: Joi.boolean().required()
            }).unknown(true))
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

/**
 * 
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
        logger.error(err.message)
        return false        
    }  
}