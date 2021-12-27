const rootRouter               = require('express').Router()
const authController           = require('../controllers/authController')
const userController           = require('../controllers/userController')
const storeController          = require('../controllers/storeController')
const inventoryController      = require('../controllers/inventoryController')
const storeInventoryController = require('../controllers/storeInventoryController')
const isAuth                   = require('../middlewares/isAuth')
const isNotAuth                = require('../middlewares/isNotAuth')

const models = require('../models/index')
const StoreInventory      = models.StoreInventory

const Joi        = require('joi')
const {Op}           = require("sequelize")
const logger = require('../utils/logger')

rootRouter.get('/', async (req, res) => {
    try {
        const x = await StoreInventory.findOne({
            where: {store_id: 1, inventory_id: 1},
            include: ['store', 'inventory']
        })
        res.send(x)

    } catch (err) {
        logger.error(err.message)
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

rootRouter.get('/store-inventories', [
    isAuth, storeInventoryController.index
])

rootRouter.post('/store-inventories', [
    isAuth, storeInventoryController.store
])

rootRouter.put('/store-inventories/:storeId/:inventoryId', [
    isAuth, storeInventoryController.update
])

rootRouter.delete('/store-inventories/:storeId/:inventoryId', [
    isAuth, storeInventoryController.destroy
])


module.exports = rootRouter