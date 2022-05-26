const rootRouter                  = require('express').Router()
const AuthController              = require('../controllers/AuthController')
const UserController              = require('../controllers/UserController')
const StoreController             = require('../controllers/StoreController')
const InventoryController         = require('../controllers/InventoryController')
const StoreInventoryController    = require('../controllers/StoreInventoryController')
const StoreTransactionController  = require('../controllers/StoreTransactionController')
const inventoryTransferController = require('../controllers/inventoryTransferController')
const isAuth                      = require('../middlewares/isAuth')
const isNotAuth                   = require('../middlewares/isNotAuth')
const authorize                   = require('../middlewares/authorize')

rootRouter.post('/register', [
    isNotAuth, AuthController.register
])
rootRouter.post('/login', [
    isNotAuth, AuthController.login
])

rootRouter
    .get('/users', [
        isAuth, authorize('admin'), UserController.index
    ])
    .post('/users', [
        isAuth, authorize('admin'), UserController.store
    ])
    .put('/users/:id', [
        isAuth, authorize('admin'), UserController.update
    ])
    .post('/users/update-profile', [
        isAuth, UserController.updateProfile
    ])
    .delete('/users/:id', [
        isAuth, authorize('admin'), UserController.delete
    ])
    .get('/users/employee-stores', [
        isAuth, authorize('admin'), UserController.getEmployeeStores
    ])
    .get('/users/user-roles', [
        isAuth, authorize('admin'), UserController.getUserRoles
    ])

rootRouter
    .get('/stores', [
        isAuth, authorize('admin'), StoreController.index
    ])
    .post('/stores', [
        isAuth, authorize('admin'), StoreController.store
    ])
    .put('/stores/:id', [
        isAuth, authorize('admin'), StoreController.update
    ])
    .delete('/stores/:id', [
        isAuth, authorize('admin'), StoreController.destroy
    ])

rootRouter
    .get('/inventories', [
        isAuth, authorize('admin'), InventoryController.index
    ])
    .post('/inventories', [
        isAuth, authorize('admin'), InventoryController.store
    ])
    .put('/inventories/:id', [
        isAuth, authorize('admin'), InventoryController.update
    ])
    .delete('/inventories/:id', [
        isAuth, authorize('admin'), InventoryController.destroy
    ])

rootRouter
    .get('/store-inventories', [
        isAuth, authorize('admin', 'employee'), StoreInventoryController.index
    ])
    .get('/store-inventories/create', [
        isAuth, authorize('admin'), StoreInventoryController.create
    ])    
    .post('/store-inventories', [
        isAuth, authorize('admin'), StoreInventoryController.store
    ])
    .put('/store-inventories/:id', [
        isAuth, authorize('admin'), StoreInventoryController.update
    ])
    .delete('/store-inventories/:id', [
        isAuth, authorize('admin'), StoreInventoryController.destroy
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

rootRouter
    .get('/inventory-transfers', [
        isAuth, authorize('admin', 'employee'), inventoryTransferController.index
    ])       
    .get('/inventory-transfers/create', [
        isAuth, authorize('employee', 'admin'), inventoryTransferController.create
    ])       
    .post('/inventory-transfers', [
        isAuth, authorize('employee', 'admin'), inventoryTransferController.store
    ])      

module.exports = rootRouter