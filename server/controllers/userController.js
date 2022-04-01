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
                let include = [
                    // Get the user's role
                    {
                        model: Role, as: 'role',  attributes: ['name'],
                    }, 
                ]
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
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['role', 'name', 'email', 'store_id']
        )) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Store the user
        const hashedPassword = await bcrypt.hash(
            '12345678', 10
        )        
        const user = await User.create({
            name: values.name, email: values.email, password: hashedPassword, 
            role_id: values.role.id, owner_id: req.user.owner_id
        })  
        // For employee role only, create the StoreEmployee for the stored user
        const roleName = values.role.name.toLowerCase()
        if(roleName === 'employee'){
            await StoreEmployee.create({user_id: user.id, store_id: values.store_id})
        }      
        res.send({
            user: await User.findOne({
                where: {id: user.id},
                include: (() => {
                    let include = [
                        // Get the user's role
                        {
                            model: Role, as: 'role',  attributes: ['name'],
                        },                         
                    ]
                    // Get the user's store employee if the queried user is employee
                    if(roleName === 'employee'){
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

            }),
            message: 'Success store new user'
        })        
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.update = async (req, res) => {
    try{
        // Get user and make sure it exists and the user's role is not super admin or owner
        const user = await User.findOne({
            where: {id: req.params.id, role_id: {[Op.notIn]: [1,2]}},
            include: [
                // Get the user's store employee
                {
                    model: StoreEmployee, as: 'storeEmployee',  
                    attributes: ['id', 'store_id'],
                },  
            ]
        })        
        // Validate the input
        const {values, errMsg} = await validateInput(req, filterKeys(
            req.body, ['role', 'role_id', 'store_id']
        )) 
        if(!user){
            return res.status(400).send({message: 'The user is not exists, or cannot be updated'})
        }        
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Get the user's original role
        const orgRole = values.role
        // Update the user
        user.role_id = values.role_id
        user.store_id = values.store_id
        await user.save()   
        
        // For employee role only, create the StoreEmployee for the stored user
        if(orgRole.name.toLowerCase() === 'employee'){
            // If the role of the employee is changed remove its store employee
            if(parseInt(orgRole.id) !== parseInt(user.role_id)){
                await user.storeEmployee.destroy()
            }
            // If the employee store is changed, update the 'store employee'
            if(user.storeEmployee.store_id !== values.store_id){
                user.storeEmployee.store_id = values.store_id
                await user.storeEmployee.save()
            }
        }

        res.send({
            message: 'Success update user'
        })     
    }catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }  
}

exports.delete = async (req, res) => {    
    try{
        // Get user and make sure it exists and the user's role is not super admin or owner
        const user = await User.findOne({
            where: {id: req.params.id, role_id: {[Op.notIn]: [1,2]}},
        })   
        if(!user){
            return res.status(400).send({message: 'The user is not exists, or cannot be updated'})
        }          
        await user.destroy()

        res.send({
            message: 'Success delete user'
        })          
    }
    catch(err){
        logger.error(err.message)
        res.status(500).send(err)
    }
}

exports.getEmployeeStores = async (req, res) => {    
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

exports.getUserRoles = async (req, res) => {    
    try{
        // Get all roles
        const roles = await Role.findAll({
            where: {id: {[Op.not]: 1}},
            attributes: ['id', 'name'],
        }) 
        res.send({
            roles: roles,
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
            // Make sure the original user's role exists
            role: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const role = await Role.findOne({
                    where: {name: {[Op.iLike]: `%${value}%`}},
                    attributes: ['id', 'name']
                })
                if(!role){
                    throw {message: 'The role does not exist'}
                }
                return role
            }),            
            // Validate the user's name
            name: Joi.string().required().trim().max(100).messages({
                'string.max': "The user's name must below 100 characters",
            }),       
            // Make sure the user's email is unique
            email: Joi.string().required().email().trim().external(async (value, helpers) => {
                const user = await User.findOne({
                    where: {email: {[Op.iLike]: `%${value}%`}}, 
                    attributes: ['id']
                })
                if(user){
                    throw {message: 'The email already taken'}
                }
                return value
            }),          
            // Make sure the updated role ID exists
            role_id: Joi.number().required().integer().external(async (value, helpers) => {
                const role = await Role.findOne({where: {
                    id: value,
                }})
                if(!role){
                    throw {message: 'Role does not exist'}
                }
                if(value === 1){
                    throw {message: 'Cannot change role to Super Admin'}
                }
                return value
            }),                
            // Make sure the store ID exists
            store_id: Joi.number().required().integer().external(async (value, helpers) => {
                const store = await Store.findOne({where: {
                    id: value,
                    owner_id: req.user.owner_id
                }})
                if(!store){
                    throw {message: 'Store does not exist'}
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
