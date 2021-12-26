const rootRouter          = require('express').Router()
const authController      = require('../controllers/authController')
const userController      = require('../controllers/userController')
const storeController     = require('../controllers/storeController')
const inventoryController = require('../controllers/inventoryController')
const isAuth              = require('../middlewares/isAuth')
const isNotAuth           = require('../middlewares/isNotAuth')

const Joi        = require('joi')
const logger = require('../utils/logger')

rootRouter.get('/', async (req, res) => {
    try {
        const {error} = Joi.array().items(Joi.object({
            id: Joi.number().integer(),
            name: Joi.string().max(100),
            production_price: Joi.number().integer(),
            selling_price: Joi.number().integer()
        })).validate([{
            id: 'wewe',
            name: 'Inventory 1',
        }])
        logger.info(error)
        res.send(error)        
    } catch (err) {
        res.send(err.message)        
    }
})

rootRouter.post('/register', [
    isNotAuth, authController.register
])
rootRouter.post('/login', [
    isNotAuth, authController.login
])
rootRouter.get('/profile', [
    isAuth, userController.show
])
rootRouter.put('/profile', [
    isAuth, userController.update
])

rootRouter.post('/stores', [
    isAuth, storeController.store
])

rootRouter.put('/stores/:id', [
    isAuth, storeController.update
])

rootRouter.delete('/stores/:id', [
    isAuth, storeController.destroy
])

rootRouter.get('/inventories', [
    isAuth, inventoryController.index
])

rootRouter.post('/inventories', [
    isAuth, inventoryController.store
])

rootRouter.put('/inventories/:id', [
    isAuth, inventoryController.update
])


module.exports = rootRouter