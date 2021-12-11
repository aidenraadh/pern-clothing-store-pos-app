const passport = require('passport')

// Make sure the user is authenticated
const isAuth = passport.authenticate('jwt', { session: false })

module.exports = isAuth