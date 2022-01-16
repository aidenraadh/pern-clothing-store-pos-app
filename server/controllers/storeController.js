const Store      = require('../models/index').Store
const Sequelize  = require("sequelize")
const {Op}       = require("sequelize")
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        // Set filters
        const filters = {}
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){
                filters.name = {[Op.iLike]: `%${value}%`}
            }
        }

        // Set limit and offset
        const limitOffset = {
            limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
            offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0
        }
        const stores = await Store.findAll({
            where: {...filters, owner_id: req.user.owner_id},
            order: [['id', 'DESC']],
            ...limitOffset
        })
        res.send({
            stores: stores,
            filters: {...filters, ...limitOffset}
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
            req.body, ['name']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }     
        // Save owner ID
        values.owner_id = req.user.owner_id
        // Store the store
        const store = await Store.create(values)

        res.send({
            store: store, 
            message: 'Success storing store'
        })    
    } catch(err) {
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try{
        // Make sure the store exists
        if(!await isStoreExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Store is not exist'})
        }
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['name']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Update the store
        const store = await Store.findOne({where: {id: req.params.id}})
        store.name = values.name
        await store.save()

        res.send({
            store: store,
            message: 'Success updating store'
        })
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

exports.destroy = async (req, res) => {
    try{
        // Make sure the store exists
        if(!await isStoreExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Store is not exist'})
        }
        await Store.destroy({where: {id: req.params.id}})

        res.send({message: 'Success deleting store'})        
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
 * @returns {boolean}
 */

const isStoreExist = async (storeId, ownerId) => {
    try {
        const {error} = Joi.number().integer().validate(storeId)
        if(error){
            return false
        }
        return await Store.findOne({
            where: {id: storeId, owner_id: ownerId}, attributes: ['id']
        }) ? true : false            
    } catch (err) {
        logger.error(err.message)
        return false
    }
}
