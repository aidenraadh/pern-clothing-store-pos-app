const Store      = require('../models/index').Store
const {Op}       = require("sequelize")
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.store = async (req, res) => {
    try {
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }     
        // Save owner ID
        values.owner_id = req.user.owner_id
        // Store the store
        const store = await Store.create(values)

        res.send({
            store: store, message: 'Success storing store'
        })    
    } catch(err) {
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try{
        if(!await isStoreExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Store is not exist'})
        }
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name']) 

        if(errMsg){
            return res.status(400).send({message: errMsg})
        }     
        await Store.update(values, {where: {id: req.params.id}})

        res.send({message: 'Success updating store'})
    } catch(err) {
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}

exports.destroy = async (req, res) => {
    try{
        if(!await isStoreExist(req.params.id, req.user.owner_id)){
            return res.status(400).send({message: 'Store is not exist'})
        }
        await Store.destroy({where: {id: req.params.id}})

        res.send({message: 'Success deleting store'})        
    } catch(err) {

    }  
}

const validateInput = async (req, inpKey) => {
    try {
        // Get all the input
        const input = filterKeys(req.body, inpKey)

        const values = await Joi.object({
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = {name: value, owner_id: req.user.id}
                // When the store is updated
                if(req.params.id){
                    filters[Op.not] = [{id: req.params.id}]
                }
                const store = await Store.findOne({where: filters, attributes: ['id']})

                if(store){
                    throw {message: 'The store name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The store name must below 100 characters',
            })
        }).validateAsync(input)        

        return {values: values}
    } catch (err) {
        return {errMsg: err.message}
    }
}

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
