const Store      = require('../models/index').Store
const Sequelize  = require("sequelize")
const {Op}       = require("sequelize")
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        // If required data only several columns
        if(req.query.onlyget){
            return res.send({
                stores: await Store.findAll({
                    attributes: req.query.onlyget.split(','),
                    where: {owner_id: req.user.owner_id}
                })
            })
        }
        // Sanitized the queries
        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.name = Joi.string().required().trim().validate(queries.name)
        queries.name = queries.name.error ? '' : queries.name.value        
        // Set filters default values
        const filters = {
            where: {owner_id: req.user.owner_id},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }
        if(queries.name){
            filters.where.name = {[Op.iLike]: `%${queries.name}%`}
        }    
        const stores = await Store.findAll({
            attributes: ['id','name','type_id'],
            where: filters.where,
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            stores: stores,
            storeTypes: Store.getTypes(),
            filters: queries
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'typeId']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }     
        // Store the store
        const store = await Store.create({
            name: values.name,
            owner_id: req.user.owner_id,
            type_id: values.typeId,
        })

        res.send({
            store: store, 
            message: 'Success storing store'
        })    
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.update = async (req, res) => {
    try{
        // Make sure the store exists
        const store = await getStore(req.params.id, req.user.owner_id)
        if(!store){
            return res.status(400).send({message: 'Store not found'})
        }
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'typeId']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Update the store
        store.name = values.name
        store.type_id = values.typeId
        await store.save()

        res.send({
            store: store,
            message: 'Success updating store'
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

exports.destroy = async (req, res) => {
    try{
        // Make sure the store exists
        const store = await getStore(req.params.id, req.user.owner_id)
        if(!store){
            return res.status(400).send({message: 'Store not found'})
        }
        await store.destroy()

        res.send({message: 'Success deleting store'})        
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
            // Make sure the store name is unique by owner
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {owner_id: req.user.id}                    
                ]
                // When the store is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const store = await Store.findOne({where: filters, attributes: ['id']})

                if(store){
                    throw {message: 'The store name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The store name must below 100 characters',
            }),
            typeId: Joi.number().required().integer().external(async (value, helpers) => {
                const storeTypeIds = Object.keys(Store.getTypes()).map(id => parseInt(id))
                // Make sure the store's type exists
                if(!storeTypeIds.includes(value)){
                    throw {message: 'The store type is not exist'}
                }
                return value
            }).messages({
                'string.max': 'The store name must below 100 characters',
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
 * @param {integer} ownerId 
 * @returns {object}
 */

const getStore = async (storeId, ownerId) => {
    try {
        const storeIdInput = Joi.number().integer().validate(storeId)
        if(storeIdInput.error){
            storeIdInput.value = ''
        }
        return  await Store.findOne({
            attributes: ['id','name','type_id'],
            where: {id: storeId, owner_id: ownerId,}
        }) 
    } catch (err) {
        throw err
    }
}
