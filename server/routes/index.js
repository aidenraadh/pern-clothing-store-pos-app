const rootRouter                 = require('express').Router()
const authController             = require('../controllers/authController')
const userController             = require('../controllers/userController')
const storeController            = require('../controllers/storeController')
const inventoryController        = require('../controllers/inventoryController')
const storeInventoryController   = require('../controllers/storeInventoryController')
const storeTransactionController = require('../controllers/storeTransactionController')
const isAuth                     = require('../middlewares/isAuth')
const isNotAuth                  = require('../middlewares/isNotAuth')
const authorize                  = require('../middlewares/authorize')

const models             = require('../models/index')
const bcrypt = require('bcrypt')
const Inventory          = models.Inventory
const Store          = models.Store
const InventorySize      = models.InventorySize
const StoreInventory      = models.StoreInventory
const StoreInventorySize      = models.StoreInventorySize
const Role      = models.Role
const Owner = models.Owner
const User = models.User

rootRouter.get('/test', async (req, res) => {
    const sum = [1,2,3].reduce(add, 0); // with initial value to avoid when the array is empty

    function add(accumulator, a) {
      return accumulator + a;
    }
    
    console.log(sum); // 6
    return res.send({message: 'asd'})
})

rootRouter.post('/register', [
    isNotAuth, authController.register
])
rootRouter.post('/login', [
    isNotAuth, authController.login
])
rootRouter.get('/users', [
    isAuth, authorize(['owner']), userController.index
])
rootRouter.post('/users', [
    isAuth, authorize(['owner']), userController.store
])

rootRouter.put('/users/:id', [
    isAuth, authorize(['owner']), userController.update
])

rootRouter.delete('/users/:id', [
    isAuth, authorize(['owner']), userController.delete
])

rootRouter.get('/users/employee-stores', [
    isAuth, authorize(['owner']), userController.getEmployeeStores
])

rootRouter.get('/users/user-roles', [
    isAuth, authorize(['owner']), userController.getUserRoles
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
    isAuth, authorize('all'), storeInventoryController.index
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

rootRouter.get('/store-transactions', [
    isAuth, authorize('all'), storeTransactionController.index
])

module.exports = rootRouter