const bcrypt        = require('bcrypt') 
const User          = require('../models/index').User
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')

exports.show = async (req, res) => {    
    try{
        res.send({user: req.user})
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.update = async (req, res) => {
    try{
        await User.update({
            name: req.body.name, email: req.body.email,
            password: await bcrypt.hash(req.body.password, 10)
        }, {
            where: {id: req.user.id}
        })
        res.send({
            user: await User.findOne({where: {id: req.user.id}})
        })     
    }catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }  
}