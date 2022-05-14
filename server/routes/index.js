const rootRouter                 = require('express').Router()
const AuthController             = require('../controllers/AuthController')
const UserController             = require('../controllers/UserController')
const StoreController            = require('../controllers/StoreController')
const InventoryController        = require('../controllers/InventoryController')
const StoreInventoryController   = require('../controllers/StoreInventoryController')
const StoreTransactionController = require('../controllers/StoreTransactionController')
const isAuth                     = require('../middlewares/isAuth')
const isNotAuth                  = require('../middlewares/isNotAuth')
const authorize                  = require('../middlewares/authorize')

rootRouter.post('/register', [
    isNotAuth, AuthController.register
])
rootRouter.post('/login', [
    isNotAuth, AuthController.login
])

rootRouter
    .get('/users', [
        isAuth, authorize('owner'), UserController.index
    ])
    .post('/users', [
        isAuth, authorize('owner'), UserController.store
    ])
    .put('/users/:id', [
        isAuth, authorize('owner'), UserController.update
    ])
    .post('/users/update-profile', [
        isAuth, UserController.updateProfile
    ])
    .delete('/users/:id', [
        isAuth, authorize('owner'), UserController.delete
    ])
    .get('/users/employee-stores', [
        isAuth, authorize('owner'), UserController.getEmployeeStores
    ])
    .get('/users/user-roles', [
        isAuth, authorize('owner'), UserController.getUserRoles
    ])

rootRouter
    .get('/stores', [
        isAuth, authorize('owner'), StoreController.index
    ])
    .post('/stores', [
        isAuth, authorize('owner'), StoreController.store
    ])
    .put('/stores/:id', [
        isAuth, authorize('owner'), StoreController.update
    ])
    .delete('/stores/:id', [
        isAuth, authorize('owner'), StoreController.destroy
    ])

rootRouter
    .get('/inventories', [
        isAuth, authorize('owner'), InventoryController.index
    ])
    .post('/inventories', [
        isAuth, authorize('owner'), InventoryController.store
    ])
    .put('/inventories/:id', [
        isAuth, authorize('owner'), InventoryController.update
    ])
    .delete('/inventories/:id', [
        isAuth, authorize('owner'), InventoryController.destroy
    ])

rootRouter
    .get('/store-inventories', [
        isAuth, authorize('owner', 'employee'), StoreInventoryController.index
    ])
    .get('/store-inventories/create', [
        isAuth, authorize('owner'), StoreInventoryController.create
    ])    
    .post('/store-inventories', [
        isAuth, authorize('owner'), StoreInventoryController.store
    ])
    .put('/store-inventories/:id', [
        isAuth, authorize('owner'), StoreInventoryController.update
    ])
    .delete('/store-inventories/:id', [
        isAuth, authorize('owner'), StoreInventoryController.destroy
    ])

rootRouter
    .get('/store-transactions', [
        isAuth, authorize('all'), StoreTransactionController.index
    ])
    .post('/store-transactions', [
        isAuth, authorize('employee'), StoreTransactionController.store
    ])    
    .delete('/store-transactions/:id', [
        isAuth, authorize('employee'), StoreTransactionController.destroy
    ])     

module.exports = rootRouter