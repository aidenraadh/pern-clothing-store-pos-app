const Store      = require('../models/index').Store
const {Op}       = require("sequelize")
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.store = async (req, res) => {
    try {
        let inp = filterKeys(req.body, ['name'])

        const {error, value} = validate(inp)
        res.send({error: error, value: value})
        // const store = await Store.create(data)
        // res.send({
        //     store: store, message: 'Success storing store'
        // })    
    } catch(err) {
        logger.error(err.message)
        res.status(500).send({message: err.message})
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

const validate = (inp) => {
    const schema = {
        name: Joi.string().trim().max(8).alphanum().required()
    }

    return Joi.object(schema).validate(inp)
}
