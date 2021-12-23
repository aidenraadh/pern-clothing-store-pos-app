const Inventory     = require('../models/index').Inventory
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')
const {checkSchema} = require('express-validator')

exports.index = async (req, res) => {    
    try{
        const limit = parseInt(req.query.limit)

        const inventories = await Inventory.findAll({
            where: {owner_id: req.user.owner_id},
            order: [['id', 'DESC']],
            limit: limit ? limit : 10
        })
        res.send({inventories: inventories})   
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.store = async (req, res) => {    
    try{
        const inventory = await Inventory.create({
            name: req.body.name, owner_id: req.user.owner_id,
        })
        res.send({
            inventory: inventory, message: 'Success storing inventory'
        })   
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }
}

exports.update = async (req, res) => {
    try{
        await Inventory.update(
            {
                name: req.body.name, owner_id: req.user.owner_id,
            }, 
            {where: {id: req.params.id}}
        )
        res.send({message: 'Success updating inventory'})
    }catch(err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }  
}


// Field rules schema
const schema = {
    name: {
        isString: {bail: true}, notEmpty: {bail: true}, errorMessage: 'Inventory name is required',
        custom: {
            bail: true,
            // Make sure the inventory name is unique by owner
            options: (value, {req}) => {
                let filters = {name: value, owner_id: req.user.owner_id}

                // When the inventory is updated
                if(req.params.id){ filters[Op.not] =  {id: req.params.id} }

                return Inventory.findOne({where: filters})
                .then(inventory => {
                    if(inventory) return Promise.reject(
                        `Inventory with name ${value} already exists`
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
            // Make sure the inventory is exist for the owner
            custom: {
                bail: true,
                options: (value, {req}) => {
                    return Inventory.findOne({where: {id: value, owner_id: req.user.owner_id}})
                    .then(inventory => {
                        if(!inventory) return Promise.reject('Inventory is not exist')
                    })                    
                }
            }
        }
    },
    ...schema
})

