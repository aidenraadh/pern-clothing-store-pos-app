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
            production_prices: (
                Object.keys(JSON.parse(req.body.production_prices)).length ? 
                req.body.production_prices : null
            ),
            selling_prices: (
                Object.keys(JSON.parse(req.body.selling_prices)).length ? 
                req.body.selling_prices : null     
            ),
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
                production_prices: (
                    Object.keys(JSON.parse(req.body.production_prices)).length ? 
                    req.body.production_prices : null
                ),
                selling_prices: (
                    Object.keys(JSON.parse(req.body.selling_prices)).length ? 
                    req.body.selling_prices : null
                ),
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
    production_prices: {
        isJSON: {bail: true}, notEmpty: {bail: true}, errorMessage: 'Production prices is not valid',
        // Make sure the size names inside production prices are match inside and selling prices
        custom: {
            bail: true,
            options: (value, {req}) => {
                try{
                    const production_prices = JSON.parse(value)
                    const selling_prices = JSON.parse(req.body.selling_prices)

                    for (let size in production_prices) {
                        if (!selling_prices.hasOwnProperty(size)) {
                            throw new Error(
                                'Sizes in production and selling prices are not matched'
                            )
                        }
                    }
                } catch(err) {
                    throw new Error(err)
                }
                return true
            }            
        }        
    },
    selling_prices: {
        isJSON: {bail: true}, notEmpty: {bail: true}, errorMessage: 'Selling prices is not valid',
        // Make sure the size names inside selling prices are match inside and production prices
        custom: {
            bail: true,
            options: (value, {req}) => {
                try{
                    const production_prices = JSON.parse(req.body.production_prices)
                    const selling_prices = JSON.parse(value)

                    for (let size in selling_prices) {
                        if (!production_prices.hasOwnProperty(size)) {
                            throw new Error(
                                'Sizes in production and selling prices are not matched'
                            )
                        }
                    }
                } catch(err) {
                    throw new Error(err)
                }
                return true
            }            
        }
    }    
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

