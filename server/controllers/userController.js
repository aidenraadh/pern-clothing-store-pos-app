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
        /*--------------- Sanitize queries ---------------*/
        
        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.role_id = Joi.number().required().integer().validate(queries.role_id)
        // Make the role ID is not super admin
        queries.role_id = queries.role_id.error ? '' : (
            queries.role_id.value === 1 ? '' : queries.role_id.value
        )   
        /*-------------------------------------------------*/

        // Set filters
        const filters = {
            where: {owner_id: req.user.owner_id, role_id: queries.role_id},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }
        // Get the users by role
        const users = await User.findAll({
            attributes: ['id', 'name'],
            where: filters.where,
            include: [
                {
                    model: Role, as: 'role',  attributes: ['id', 'name'],
                }, 
                {
                    model: StoreEmployee, as: 'storeEmployee', 
                    attributes: ['id'],
                    required: false,
                    include: [{
                        model: Store, as: 'store', 
                        attributes: ['id', 'name'],
                        required: false
                    }]                        
                }                
            ],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
       
        res.send({
            users: users,
            filters: queries
        })
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {    
    try{
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'email', 'roleId', 'storeId']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Store the user
        const hashedPassword = await bcrypt.hash(
            '12345678', 10
        )        
        const user = await User.create({
            name: values.name, email: values.email, password: hashedPassword, 
            role_id: values.roleId, owner_id: req.user.owner_id,
            language_id: 1,
        })  
        // For employee role only, create the StoreEmployee for the stored user
        if(values.roleId === 3){
            await StoreEmployee.create({user_id: user.id, store_id: values.storeId})
        }      
        res.send({
            user: await User.findOne({
                attributes: ['id', 'name'],
                where: {id: user.id},
                include: (() => {
                    let include = [
                        // Get the user's role
                        {
                            model: Role, as: 'role',  attributes: ['id', 'name'],
                        },
                        {
                            model: StoreEmployee, as: 'storeEmployee', 
                            attributes: ['id'],
                            required: false,
                            include: [{
                                model: Store, as: 'store', 
                                attributes: ['id', 'name'],
                            }],
                        }
                    ]
                    return include
                })(),                

            }),
            message: 'Success storing new user'
        })        
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.update = async (req, res) => {
    try{      
        // Get the user
        const user = await getNonAdminUser(req.params.id, req.user.owner_id)      
        if(!user){
            return res.status(400).send({message: 'The user is not exists, or cannot be updated'})
        }          
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['roleId', 'storeId'])        
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }     
        // When the user is changed from employee to admin
        if(parseInt(user.role_id) === 3 && values.roleId === 2){
            await user.storeEmployee.destroy()
        }
        // When the user is employee and the employement store is changed
        else if(parseInt(user.role_id) === 3){
            if(parseInt(user.storeEmployee.store.id) !== values.storeId){
                await user.storeEmployee.update({
                    store_id: values.storeId
                })
            }
        }
        // Update the user
        user.role_id = values.roleId
        await user.save()           

        res.send({
            user: await getNonAdminUser(req.params.id, req.user.owner_id),
            message: 'Success updating user'
        })     
    }catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

exports.delete = async (req, res) => {    
    try{
        // Get the user 
        const user = await getNonAdminUser(req.params.id, req.user.owner_id)     
        if(!user){
            return res.status(400).send({message: 'The user is not exists, or cannot be updated'})
        }          
        await user.destroy()

        res.send({
            message: 'Success deleting user'
        })          
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.getEmployeeStores = async (req, res) => {    
    try{
        // Get all stores
        const stores = await Store.findAll({
            where: {owner_id: req.user.owner_id, type_id: 1},
            attributes: ['id', 'name'],
            order: [['id', 'DESC']],
        }) 
        res.send({
            stores: stores,
        })
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
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
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.updateProfile = async (req, res) => {    
    try{
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'old_password', 'new_password', 'languageId']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Update the profile
        const data = {
            name: values.name,
            language_id: values.languageId
        }
        if(values.new_password !== ''){ data.password = values.new_password }

        await User.update(data, {where: {id: req.user.id}})
        // Get the new profile
        const user = await User.findOne({
            where: {id: req.user.id},
            include: (() => {
                let include = [
                    // Get the user's role
                    {
                        model: Role, as: 'role',  attributes: ['name'],
                    }, 
                ]
                // Get the user's store employee if the queried user is employee
                if(req.user.role.name.toLowerCase() === 'employee'){
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
        })      
        res.send({
            user: user,
            message: 'Profile successfully updated'
        })        
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

/**
 * 
 * @param {object} req - The request body
 * @param {object} input - Key-value pair of the user input
 * @returns {object} - Validated and sanitized input with error message
 */

 const validateInput = async (req, inputKeys) => {
    try {
        const input = filterKeys(req.body, inputKeys)
        const rules = {         
            // Validate the user's name
            name: Joi.string().required().trim().max(100).messages({
                'string.max': "The user's name must below 100 characters",
            }),     
            // Make sure the user's email is unique
            languageId: Joi.number().required().integer().external(async (value, helpers) => {
                const languageIds = Object.keys(User.getLanguages()).map(id => parseInt(id))
                if(!languageIds.includes(value)){
                    throw {message: "The language doesn't exist"}
                }
                return value
            }),                
            // Make sure the user's email is unique
            email: Joi.string().required().trim().email().external(async (value, helpers) => {
                const user = await User.findOne({
                    where: {email: {[Op.iLike]: `%${value}%`}}, 
                    attributes: ['id']
                })
                if(user){
                    throw {message: 'The email already taken'}
                }
                return value
            }),       
            // Make the user's old password match
            old_password: Joi.string().required().trim().allow('', null).external(async (value, helpers) => {
                if(value === ''){ return value }
                if(!await bcrypt.compare(value, req.user.password)){
                    throw {message: "The old password doesn't match"}
                }                
                return value
            }),     
            // Make the user's new password is different from old password
            new_password: Joi.string().required().trim().allow('', null).external(async (value, helpers) => {
                // If the password is not changed
                if(value === '' && req.body.old_password === ''){ return value }
                // If the password is empty but old password is not
                if(value === '' && req.body.old_password !== ''){
                    throw {message: "New password must be filled if the old password is filled"}
                }              
                if(value === req.body.old_password){
                    throw {message: "The new password must be different"}
                }                     
                const hashedNewPassword = await bcrypt.hash(
                    value, 10
                )                           
                return hashedNewPassword
            }),                         
            // Make sure the role exists
            roleId: Joi.number().required().integer().external(async (value, helpers) => {
                const role = await Role.findOne({
                    attributes: ['id'],
                    where: {id: value}
                })
                if(!role){
                    throw {message: 'Role does not exist'}
                }
                if(value === 1){
                    throw {message: 'Cannot set role to Super Admin'}
                }
                return value
            }),                
            storeId: Joi.number().required().integer().allow('', null).external(async (value, helpers) => {
                const roleId = parseInt(input.roleId)
                // When the role specified is admin, no need to validate the store_id
                if(roleId === 2){
                    return value
                }
                // If the role is employee, make sure the store_id is defined
                if(roleId === 3 && !value){
                    throw {message: 'Please specify the store'}
                }
                // Make sure the store exists
                const store = await Store.findOne({
                    attributes: ['id', 'type_id'],
                    where: {
                        id: value,
                        owner_id: req.user.owner_id
                    }
                })
                if(!store){
                    throw {message: 'Store does not exist'}
                }
                // Make sure the store is regular store
                if(store.type_id !== 1){
                    throw {message: 'The store is not regular store'}
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

/**
 * 
 * @param {integer} id - The user ID
 * @param {integer} ownerId 
 * @returns 
 */

const getNonAdminUser = async (id, ownerId) => {
    try {
        const idInput = Joi.number().required().integer().validate(id)
        if(idInput.error){
            idInput.value = ''
        }
        // Get user and make sure it exists and the user's role is not super admin or admin,
        // also make sure the owner_id is the same as the auth user
        return await User.findOne({
            where: {
                id: idInput.value, role_id: {[Op.notIn]: [1,2]},
                owner_id: ownerId
            },
            include: [
                {
                    model: Role, as: 'role',  attributes: ['name'],
                },
                {
                    model: StoreEmployee, as: 'storeEmployee', 
                    attributes: ['id'],
                    required: false,
                    include: [{
                        model: Store, as: 'store', 
                        attributes: ['id', 'name'],
                    }],
                } 
            ]
        })          
    } catch (err) {
        logger.error(err, {errObj: err})
        throw err
    }    
}
