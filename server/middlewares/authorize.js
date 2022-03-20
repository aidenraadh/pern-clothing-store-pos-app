const {Op}   = require("sequelize")
const models = require('../models/index')
const Role   = models.Role
const Store  = models.Store
const StoreEmployee  = models.StoreEmployee

const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            const authorizedRoles = await Role.findAll({
                where: {
                    [Op.or]: roles.map(role => ({
                        name: {[Op.iLike]: `%${role}%`}
                    }))
                },
                attributes: ['id', 'name']
            })
            const userRole = authorizedRoles.find((role) => (
                parseInt(role.id) === parseInt(req.user.role_id)
            ))
            // Make sure the user's role exists in the authorized roles
            if(!userRole){
                return res.status(401).send('Unauthorized. This user is not authorized to any of the roles.')
            }
            // For employee role only, make sure the user's storeEmployee exists
            // and the store where user is employed exists
            if(userRole.name.toLowerCase() === 'employee'){
                if(req.user.storeEmployee){
                    const store = await Store.findOne({
                        where: {id: req.user.storeEmployee.store_id}, attributes: ['id']
                    })
                    if(!store){
                        return res.send.status(401).send('Unauthorized. This user is not employed to any of the stores.')
                    }                
                }
                else{
                    res.send.status(401).send('Unauthorized. This user is not employed to any of the stores.')
                }
            }
    
            next()            
        } catch (error) {
            return res.send.status(401).send({message: 'asd'})
        }
    }
}

module.exports = authorize