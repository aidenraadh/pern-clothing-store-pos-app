const jwt           = require('jsonwebtoken')
const bcrypt        = require('bcrypt')
const Joi           = require('joi') 
const path          = require('path')
const logger        = require('../utils/logger')
const fs            = require('fs')
const models        = require('../models/index')
const User          = models.User
const StoreEmployee = models.StoreEmployee
const Role          = models.Role

exports.register = async (req, res) => {    
    try{     
        const hashedPassword = await bcrypt.hash(
            req.body.password, 10
        )
        const user = await User.create({
            name: req.body.name, email: req.body.email,
            password: hashedPassword,
        })
        // Issue JWT
        const jwt = issueJWT(user)

        res.send({
            message: 'Success',
            user: await User.findOne({where: {id: user.id}}),
            token: jwt.token,
            expiresIn: jwt.expiresIn
        })        
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.login = async (req, res) => {
    try{
        // Validate email input
        const emailInput = Joi.string().required().trim().email().validate(req.body.email)
        if(emailInput.error){
            return res.status(400).send({message: 'Email is invalid'})
        }
        // Validate password input
        const passwordInput = Joi.string().required().trim().validate(req.body.password)
        if(passwordInput.error){
            return res.status(400).send({message: 'Password is invalid'})
        }        
        const user = await User.scope('withPassword').findOne({
            where: {email: emailInput.value},
            attributes: ['id', 'email', 'password']
        })
        if(!user){
            return res.status(400).send({message: 'Invalid email or password'})
        }
        if(!await bcrypt.compare(passwordInput.value, user.password)){
            return res.status(400).send({message: 'Invalid email or password'})
        }
        // Issue JWT
        const jwt = issueJWT(user)

        res.send({
            message: 'Success',
            user: await User.findOne({
                where: {id: user.id}, 
                    include: [
                    // Get the user's role
                    {
                        model: Role, as: 'role',  attributes: ['name'],
                    },                      
                    // Get the user's store employee if exists
                    {
                        model: StoreEmployee, as: 'storeEmployee', 
                        attributes: ['id', 'store_id'],
                    }
                ]                
            }),
            languages: User.getLanguages(),
            token: jwt.token,
            expiresIn: jwt.expiresIn
        })          
    } catch (err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }  
}

const issueJWT = (user) => {
    try {
        const pathToKey = path.join(__dirname, '..', 'id_rsa_priv.pem')
        const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8')
    
        const currentTime = Date.now()
        const expiresIn = currentTime / 1000 + (3600 * 24) // 1 day
    
        const payload = {
            sub: user.id,
            iat: currentTime,
            exp: expiresIn
        }
    
        const signedToken = jwt.sign(payload, PRIV_KEY, {
            algorithm: 'RS256'
        })
        return {
            token: 'Bearer '+signedToken,
            expiresIn: expiresIn
        }        
    } catch (error) {
        throw error
    }
}