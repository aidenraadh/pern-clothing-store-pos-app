const JwtStrategy   = require('passport-jwt').Strategy
const ExtractJwt    = require('passport-jwt').ExtractJwt
const path          = require('path')
const fs            = require('fs')
const logger        = require('../utils/logger')
const User          = require('../models/index').User
const Owner         = require('../models/index').Owner
const StoreEmployee = require('../models/index').StoreEmployee

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
        const user = await User.findOne({
            where: {id: payload.sub},
            include: [
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

        // Check if the owner exists
        const owner = await Owner.findOne({where: {id: user.owner_id}, attributes: ['id']})
        if(!owner){
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