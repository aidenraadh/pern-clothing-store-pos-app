const rootRouter          = require('express').Router()
const authController      = require('../controllers/authController')
const userController      = require('../controllers/userController')
const storeController     = require('../controllers/storeController')
const inventoryController = require('../controllers/inventoryController')
const isAuth              = require('../middlewares/isAuth')
const isNotAuth           = require('../middlewares/isNotAuth')

const Inventory      = require('../models/index').Inventory
const InventorySize      = require('../models/index').InventorySize

const Joi        = require('joi')
const logger = require('../utils/logger')

rootRouter.get('/', async (req, res) => {
    try {
        const test = await Inventory.findOne({
            where: {id: 1},
            include: [{model: InventorySize, as: 'sizes'}]
        })
        res.send(test)

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

rootRouter.delete('/inventories/:id', [
    isAuth, inventoryController.destroy
])


module.exports = rootRouter