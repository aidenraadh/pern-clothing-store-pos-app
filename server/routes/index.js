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

const haha = (...items) => {
    items = items.map(item => item.toLowerCase())
    console.log(items)
}

rootRouter.get('/new-owner', async (req, res) => {
    // const owner = await Owner.create({})
    // const hashedPassword = await bcrypt.hash(
    //     '12345678', 10
    // )    
    // await User.create({
    //     name: 'ownerA',
    //     email: 'testownera@gmail.com',
    //     password: hashedPassword,
    //     owner_id: owner.id,
    //     role_id: 2
    // })
    return res.send({message: 'asd'})
})

rootRouter.get('/test', async (req, res) => {
    // User.update(
    //     {password: await bcrypt.hash('12345678', 10)},
    //     {where: {id: 1}}
    // )
    return res.send({message: 'asd'})
})

rootRouter.post('/register', [
    isNotAuth, authController.register
])
rootRouter.post('/login', [
    isNotAuth, authController.login
])

rootRouter
    .get('/users', [
        isAuth, authorize('owner'), userController.index
    ])
    .post('/users', [
        isAuth, authorize('owner'), userController.store
    ])
    .put('/users/:id', [
        isAuth, authorize('owner'), userController.update
    ])
    .post('/users/update-profile', [
        isAuth, userController.updateProfile
    ])
    .delete('/users/:id', [
        isAuth, authorize('owner'), userController.delete
    ])
    .get('/users/employee-stores', [
        isAuth, authorize('owner'), userController.getEmployeeStores
    ])
    .get('/users/user-roles', [
        isAuth, authorize('owner'), userController.getUserRoles
    ])

rootRouter
    .get('/stores', [
        isAuth, authorize('owner'), storeController.index
    ])
    .post('/stores', [
        isAuth, authorize('owner'), storeController.store
    ])
    .put('/stores/:id', [
        isAuth, authorize('owner'), storeController.update
    ])
    .delete('/stores/:id', [
        isAuth, authorize('owner'), storeController.destroy
    ])

rootRouter
    .get('/inventories', [
        isAuth, authorize('owner'), inventoryController.index
    ])
    .post('/inventories', [
        isAuth, authorize('owner'), inventoryController.store
    ])
    .put('/inventories/:id', [
        isAuth, authorize('owner'), inventoryController.update
    ])
    .delete('/inventories/:id', [
        isAuth, authorize('owner'), inventoryController.destroy
    ])

rootRouter
    .get('/store-inventories', [
        isAuth, authorize('owner', 'employee'), storeInventoryController.index
    ])
    .post('/store-inventories', [
        isAuth, authorize('owner'), storeInventoryController.store
    ])
    .put('/store-inventories/:id', [
        isAuth, authorize('owner'), storeInventoryController.update
    ])
    .delete('/store-inventories/:id', [
        isAuth, authorize('owner'), storeInventoryController.destroy
    ])

rootRouter
    .get('/store-transactions', [
        isAuth, authorize('all'), storeTransactionController.index
    ])
    .post('/store-transactions', [
        isAuth, authorize('employee'), storeTransactionController.store
    ])    
    .delete('/store-transactions/:id', [
        isAuth, authorize('employee'), storeTransactionController.destroy
    ])     

module.exports = rootRouter