const bcrypt        = require('bcrypt') 
const User          = require('../models/index').User
const {Op}          = require("sequelize")
const logger        = require('../utils/logger')
const {checkSchema} = require('express-validator')

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

exports.updateRules = checkSchema({
    name: {
        notEmpty: true, errorMessage: 'Name is required',
    },
    email: {
        isEmail: {
            bail: true, errorMessage: 'New email is not valid',
        },
        custom: {
            bail: true,
            options: (value, {req}) => {
                return User
                    .findOne({where: {
                        [Op.not]: {id: req.user.id}, email: value,
                    }})
                    .then(user => {
                        if(user){
                            return Promise.reject('New e-mail already in use')
                        }
                    })
            },
        },                
    },
    password: {
        isLength: {
            bail: true, options: {min: 8},
            errorMessage: 'New password should be at least 8 chars long',
        },
    },  
    oldPassword: {
        isLength: {
            bail: true, options: {min: 8},
            errorMessage: 'Old password should be at least 8 chars long',
        },
        custom: {
            bail: true,
            options: (value, {req}) => {
                return User.scope('withPassword')
                    .findOne({where: {
                        id: req.user.id
                    }})
                    .then(async user => {
                        if(!await bcrypt.compare(value, user.password)){
                            return Promise.reject("Old password doesn't match")
                        }
                    })
            },
        },            
    },      
})