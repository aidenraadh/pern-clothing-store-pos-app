const JwtStrategy   = require('passport-jwt').Strategy
const ExtractJwt    = require('passport-jwt').ExtractJwt
const path          = require('path')
const fs            = require('fs')
const logger        = require('../utils/logger')

const models        = require('../models/index')
const Role          = models.Role
const User          = models.User
const Owner         = models.Owner
const StoreEmployee = models.StoreEmployee

const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem')
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8')

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
}

const authenticate = async (payload, done) => {  
    try{
        // Check if the user exists
        const user = await User.scope('withPassword').findOne({
            where: {id: payload.sub},
            include: [
                // Get the user's owner
                {
                    model: Owner, as: 'owner',  attributes: ['id'],
                },  
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
        })
        if(!user){
            return done(null, false)
        }
        if(!user.owner){
            return done(null, false)
        }        

        return done(null, user)
    } catch (err){
        logger.error(err.message)
        res.status(500).send(err.message)
    }    
}

const initPassport = (passport) => {
    passport.use(new JwtStrategy(
        opts, authenticate
    ))
}

module.exports = initPassport