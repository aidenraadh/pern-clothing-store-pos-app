const bcrypt        = require('bcrypt') 
const {Op}          = require("sequelize")
const Joi           = require('joi')
const filterKeys    = require('../utils/filterKeys')
const logger        = require('../utils/logger')
const models        = require('../models/index')
const User          = models.User
const Store         = models.Store
const Role          = models.Role
const StoreEmployee = models.StoreEmployee


exports.index = async (req, res) => {    
    try{
        // Set filters
        const filters = {
            where: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        // Make sure the user's role exists
        let role = null
        const {value, error} = Joi.string().required().validate(req.query.role)
        if(error === undefined){
            role = await Role.findOne({
                where: {name: {[Op.iLike]: `%${value}%`}},
                attributes: ['id']
            })
        }
        // Get the users by role
        const users = await User.findAll({
            where: {role_id: role ? role.id : 0, owner_id: req.user.owner_id},
            include: (() => {
                let include = []
                // Get the user's store employee if the queried user is employee
                if(req.query.role === 'employee'){
                    include.push({
                        model: StoreEmployee, as: 'storeEmployee', 
                        attributes: ['user_id', 'store_id'],
                        include: [{
                            model: Store, as: 'store', 
                            attributes: ['name'],
                        }]
                    })
                }
                return include
            })(),
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
       
        res.send({
            users: users,
            filters: {...filters.where, ...filters.limitOffset}
        })
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.show = async (req, res) => {    
    try{
        res.send({user: req.user})
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.store = async (req, res) => {    
    try{

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

exports.delete = async (req, res) => {    
    try{

    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.getEmployeeStore = async (req, res) => {    
    try{
        // Get all stores
        const stores = await Store.findAll({
            where: {owner_id: req.user.owner_id},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        }) 
        res.send({
            stores: stores,
        })
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
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
            // Make sure the role ID exists
            role_id: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const role = await Role.findOne({where: {
                    id: value
                }})
                if(role){
                    throw {message: 'User role does not exist'}
                }                
                return value
            }),

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
