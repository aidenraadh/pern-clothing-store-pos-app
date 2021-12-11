const passport = require('passport')

// Make sure the user is not authenticated
const isNotAuth = (req, res, next) => {
    passport.authenticate('jwt', (err, user, info) => {
        if(user){
            return res.status(401).send('Unauthorized')
        }
        next()
    })(req, res, next)   
}

module.exports = isNotAuth