const Inventory     = require('../models/index').Inventory
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')

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
