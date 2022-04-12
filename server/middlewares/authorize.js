const Store  = require('../models/index').Store

const authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const userRole = req.user.role.name.toLowerCase()
            roles = roles.map(role => role.toLowerCase())

            if(roles.length === 1 && roles[0] === 'all'){
                return next() 
            }
            // Make sure the user's role exists in the authorized roles
            if(!roles.includes(userRole)){
                return res.status(401).send('Unauthorized. This user is not authorized to any of the roles.')
            }
            // For employee role only, make sure the store where user is employed exists
            if(userRole === 'employee'){
                if(req.user.storeEmployee){
                    const store = await Store.findOne({
                        where: {id: req.user.storeEmployee.store_id}, attributes: ['id']
                    })
                    if(!store){
                        return res.send.status(401).send('Unauthorized. This user is not employed to any of the stores.')
                    }                
                }
                else{
                    return res.send.status(401).send('Unauthorized. This user is not employed to any of the stores.')
                }
            }
    
            next()            
        } catch (error) {
            return res.send.status(500).send({message: 'Server error'})
        }
    }
}

module.exports = authorize