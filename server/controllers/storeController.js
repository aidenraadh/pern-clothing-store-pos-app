const Store         = require('../models/index').Store
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')

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

