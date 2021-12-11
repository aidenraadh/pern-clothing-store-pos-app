const {validationResult} = require('express-validator')

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
    } catch (error){
        console.log(error)
    }  
}

module.exports = validate