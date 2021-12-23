const {validationResult} = require('express-validator')
const logger             = require('../utils/logger')

// Validate the user's input
const validate = (req, res, next) => {
    try{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).send({
                message: errors.array()[0].msg
            })
        }
        next()  
    } catch (err){
        logger.error(err.message)
    }  
}

module.exports = validate