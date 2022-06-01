const rootRouter                  = require('express').Router()
const AuthController              = require('../controllers/AuthController')
const UserController              = require('../controllers/UserController')
const StoreController             = require('../controllers/StoreController')
const InventoryController         = require('../controllers/InventoryController')
const StoreInventoryController    = require('../controllers/StoreInventoryController')
const StoreTransactionController  = require('../controllers/StoreTransactionController')
const inventoryTransferController = require('../controllers/inventoryTransferController')
const statisticController         = require('../controllers/statisticController')
const isAuth                      = require('../middlewares/isAuth')
const isNotAuth                   = require('../middlewares/isNotAuth')
const authorize                   = require('../middlewares/authorize')

const {Op} = require("sequelize")
const sequelize = require("sequelize")

const Joi                      = require('joi')

const models                   = require('../models/index')
const Inventory                = models.Inventory
const InventorySize            = models.InventorySize
const Store            = models.Store
const StoreInventory           = models.StoreInventory
const StoreInventorySize           = models.StoreInventorySize
const logger = require('../utils/logger')


rootRouter.get('/test', async (req, res) => {
    try {
        const {value, error} = Joi.date().validate('2020-02-12')
        console.log(value)
        console.log(error)
        res.send({
            data: 'asd'
        })
    } catch (error) {
        logger.error(error, {errorObj: error})
        res.status(500).send({message: error.message})   
    }
})

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

rootRouter
    .get('/statistics/total-inventories', [
        isAuth, authorize('admin'), statisticController.countInventories
    ])  
    .get('/statistics/sum-stored-inventories', [
        isAuth, authorize('admin'), statisticController.sumStoredInventories
    ])    
    .get('/statistics/sum-production-prices', [
        isAuth, authorize('admin'), statisticController.sumProdPrices
    ])

module.exports = rootRouter