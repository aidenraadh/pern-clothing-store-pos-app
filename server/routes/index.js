const rootRouter               = require('express').Router()
const authController           = require('../controllers/authController')
const userController           = require('../controllers/userController')
const storeController          = require('../controllers/storeController')
const inventoryController      = require('../controllers/inventoryController')
const storeInventoryController = require('../controllers/storeInventoryController')
const isAuth                   = require('../middlewares/isAuth')
const isNotAuth                = require('../middlewares/isNotAuth')

const models             = require('../models/index')
const Inventory          = models.Inventory
const Store          = models.Store
const InventorySize      = models.InventorySize
const StoreInventory      = models.StoreInventory

rootRouter.get('/test', async (req, res) => {
    const storeInvs = await StoreInventory.findOne({
        where: {id: 1},
        include: [
            {
                model: Store, as: 'store', 
                attributes: ['id', 'name'],
                where: {owner_id: 1}
            },                       
        ],        
    })
    res.send({
        data: storeInvs,
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
    isAuth, storeController.index
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

rootRouter.put('/store-inventories/:id', [
    isAuth, storeInventoryController.update
])

rootRouter.delete('/store-inventories/:id', [
    isAuth, storeInventoryController.destroy
])


module.exports = rootRouter