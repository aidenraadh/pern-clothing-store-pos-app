const rootRouter               = require('express').Router()
const authController           = require('../controllers/authController')
const userController           = require('../controllers/userController')
const storeController          = require('../controllers/storeController')
const inventoryController      = require('../controllers/inventoryController')
const storeInventoryController = require('../controllers/storeInventoryController')
const isAuth                   = require('../middlewares/isAuth')
const isNotAuth                = require('../middlewares/isNotAuth')
const authorize                = require('../middlewares/authorize')

const models             = require('../models/index')
const Inventory          = models.Inventory
const Store          = models.Store
const InventorySize      = models.InventorySize
const StoreInventory      = models.StoreInventory
const StoreInventorySize      = models.StoreInventorySize
const Role      = models.Role

rootRouter.get('/test', isAuth, async (req, res) => {
    const data = req.user.owner_id
    console.log(req.user)
    res.send({
        data: data,
        message: 'test'
    })
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

rootRouter.get('/stores', [
    isAuth, authorize(['owner']), storeController.index
])

rootRouter.post('/stores', [
    isAuth, authorize(['owner']), storeController.store
])

rootRouter.put('/stores/:id', [
    isAuth, authorize(['owner']), storeController.update
])

rootRouter.delete('/stores/:id', [
    isAuth, authorize(['owner']), storeController.destroy
])

rootRouter.get('/inventories', [
    isAuth, authorize(['owner']), inventoryController.index
])

rootRouter.post('/inventories', [
    isAuth, authorize(['owner']), inventoryController.store
])

rootRouter.put('/inventories/:id', [
    isAuth, authorize(['owner']), inventoryController.update
])

rootRouter.delete('/inventories/:id', [
    isAuth, authorize(['owner']), inventoryController.destroy
])

rootRouter.get('/store-inventories', [
    isAuth, authorize(['owner', 'employee']), storeInventoryController.index
])

rootRouter.post('/store-inventories', [
    isAuth, authorize(['owner']), storeInventoryController.store
])

rootRouter.put('/store-inventories/:id', [
    isAuth, authorize(['owner']), storeInventoryController.update
])

rootRouter.delete('/store-inventories/:id', [
    isAuth, authorize(['owner']), storeInventoryController.destroy
])


module.exports = rootRouter