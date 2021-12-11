const Store          = require('../models/index').Store
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')
const {checkSchema} = require('express-validator')

exports.store = async (req, res) => {    
    try{
        const store = await Store.create({
            name: req.body.name, owner_id: req.user.owner_id,
        })
        res.send({
            store: store, message: 'Success storing store'
        })    
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try{
        await Store.update(
            {name: req.body.name}, {where: {id: req.params.id}}
        )
        res.send({message: 'Success updating store'})
    }catch(err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}


// Field rules schema
const schema = {
    name: {
        isString: {bail: true}, notEmpty: {bail: true}, errorMessage: 'Store name is required',
        custom: {
            bail: true,
            // Make sure the store name is unique by owner
            options: (value, {req}) => {
                let filters = {name: value, owner_id: req.user.owner_id}

                // When the store is updated
                if(req.params.id){ filters[Op.not] =  {id: req.params.id} }

                return Store.findOne({where: filters})
                .then(store => {
                    if(store) return Promise.reject(
                        `Store with name ${value} already exists`
                    )
                })
            }
        }
    },
}

exports.storeRules = checkSchema(schema)

exports.updateRules = checkSchema({
    ...{
        id: {
            notEmpty: {bail: true}, isNumeric: {bail: true},
            // Make sure the store is exist for the owner
            custom: {
                bail: true,
                options: (value, {req}) => {
                    return Store.findOne({where: {id: value, owner_id: req.user.owner_id}})
                    .then(store => {
                        if(!store) return Promise.reject('Store is not exist')
                    })                    
                }
            },
        }
    },
    ...schema
})

