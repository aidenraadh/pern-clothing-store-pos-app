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
            whereStoreInvSize: {},
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
        if(req.query.empty_size_only === 'true'){
            filters.whereStoreInvSize.empty_size_only = true
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
                    required: true,
                    where: (() => {
                        const where = {...filters.whereStoreInvSize}
                        if(where.empty_size_only){
                            where['amount'] = null
                            delete where.empty_size_only
                        }
                        return where
                    })()
                },
                {
                    model: Store, as: 'store', 
                    attributes: ['id', 'name', 'type_id'],
                    where: {owner_id: req.user.owner_id},
                    required: true,
                },
                {
                    model: Inventory, as: 'inventory', 
                    attributes: ['id', 'name'],
                    where: (() => {
                        let where = {...filters.whereInv, owner_id: req.user.owner_id}
                        if(where.name){ where.name = {[Op.iLike]: `%${where.name}%`} }
                        return where
                    })(),
                    required: true,
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
                ...filters.whereStoreInvSize,
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
        // return res.send({
        //     data: values.updatedSizes,
        //     message: 'asdasd'
        // })         
        // Update the updated store inventory size
        for (const storeInvSize of values.updatedSizes) {
            await StoreInventorySize.update(
                {amount: storeInvSize.amount},
                {where: {id: storeInvSize.id}}
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
                        if(sizeIds.includes(parseInt(size.id))){
                            const amount = size.amount ? size.amount : null
                            sanitizedSizes.push({...size, amount: amount})
                            totalAmount += amount ? amount : 0
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
                sizeName: Joi.string().required(),
                amount: Joi.number().required().integer().allow('', null),
                isChanged: Joi.boolean().required()
            }).unknown(true)).external(async (value, helpers) => {
                // Prepare the filtered updated sizes
                const filteredUpdatedSizes = []
                // Get the StoreInventory
                const storeInv = await getStoreInventory(req.params.id, req.user.owner_id)

                value.forEach(storeInvSize => {
                    // Get the StoreInventorySize
                    const isStoreInvSizeExists = storeInv.sizes.find(size => (
                        parseInt(size.id) === storeInvSize.id
                    ))
                    if(!isStoreInvSizeExists){
                        throw {messagee: `The size ${storeInvSize.sizeName} is not exist`}
                    }
                    // Check if StoreInventorySize is changed
                    if(storeInvSize.isChanged){
                        filteredUpdatedSizes.push({
                            id: storeInvSize.id,
                            amount: storeInvSize.amount ? storeInvSize.amount : null
                        })
                    }
                })
                return filteredUpdatedSizes
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
                    required: false, // Make sure the store exist for this owner
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
                    required: true, // Make sure the inventory exist for this owner
                    include: [{
                        model: InventorySize, as: 'sizes', 
                        attributes: ['id', 'name', 'production_price', 'selling_price'],
                        required: false,
                    }]
                },                          
            ],        
        })             
          
    } catch (err) {
        throw err
    }
}

/**
 * This method will:
 * - Delete all StoreInventorySize where the 'amount' is 0 or NULL
 * - Delete all StoreInventorySize where inventory size is not exist
 * - Recalculate the StoreInventory 'total_amount'
 * @param {array} ids - array of store inventory IDs or inventory IDs 
 * @param {string} model - the model refrensing the 'ids'
 * @param {boolean} removeDeletedSize - whether or not the size that doesnt exist is also removed from store inventory size
 */

const refreshStoreInventory = async (ids, model, removeDeletedSize = true) => {
    try {
        let where = {}
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
                        required: false,
                    }]
                },                          
            ],        
        })       
        // This is all StoreInventorySize ID that will be deleted
        const deletedStoreInvSizeIds = []
        // This is all StoreInventorySize will be added
        const addedStoreInvSizes = []        
        // This is all StoreInventorySize will be set to NULL if the amount is 0
        const updatedStoreInvSizes = []           
        for(const storeInv of storeInvs){
            let totalAmount = 0
            // Loop through StoreInventorySize
            for(const storeInvSize of storeInv.sizes){
                // Make sure the size is exist
                const isExists = storeInv.inventory.sizes.find(existedSize => (
                    parseInt(existedSize.id) === parseInt(storeInvSize.inventory_size_id)
                ))
                if(isExists){
                    // When the amount is 0, update StoreInventorySize amount to null
                    if(storeInvSize.amount === 0){
                        updatedStoreInvSizes.push({
                            id: storeInvSize.id, amount: null
                        })
                    }
                    totalAmount += (storeInvSize.amount ? storeInvSize.amount : 0)
                }
                // When the size is not exist, remove it
                else{
                    deletedStoreInvSizeIds.push(storeInvSize.id)
                }
            }
            // Loop through InventorySize
            for (const invSize of storeInv.inventory.sizes) {
                // Check if the InventorySize is exist inside StoreInventorySize
                const isInvSizeExist = storeInv.sizes.find(storeInvSize => (
                    parseInt(invSize.id) === parseInt(storeInvSize.inventory_size_id)
                ))
                // If the StoreInventorySize is not exists
                if(!isInvSizeExist){
                    addedStoreInvSizes.push({
                        store_inventory_id: storeInv.id,
                        inventory_size_id: invSize.id,
                        amount: null,
                    })
                }
            }
            // Update the total amount of store inventory
            if(storeInv.total_amount !== totalAmount){
                storeInv.total_amount = totalAmount
                await storeInv.save()
            }
        }    
        for (const storeInvSize of updatedStoreInvSizes) {
            await StoreInventorySize.update(
                {amount: storeInvSize.amount},
                {id: storeInvSize.id}
            )
        }
        // Remove the size that doesnt exist
        if(deletedStoreInvSizeIds.length){
            await StoreInventorySize.destroy({where: {id: deletedStoreInvSizeIds}})             
        } 
        // Add the size that doesnt exist
        if(addedStoreInvSizes.length){
            await StoreInventorySize.bulkCreate(addedStoreInvSizes)
        }
    } catch (err) {
        throw err     
    }  
}