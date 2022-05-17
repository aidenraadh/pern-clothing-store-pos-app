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

const sequelize = require('sequelize')
const models = require('../models/index')
const StoreInventory = models.StoreInventory

rootRouter.get('/hehe', async (req, res) => {
    try {
        const x = await StoreInventory.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
            ],
            where: {store_id: 1}
        })
        res.send({
            data: x
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }        
})

rootRouter.get('/test', async (req, res) => {
    var myAsyncFuncs = [
        async () => {
            const store = await Store.findOne()
            return Promise.resolve(store.name)  
        },
        async (val) => {
            console.log('the val is ', val)
            return Promise.resolve(val)
        },
        async(val) => {
            console.log(x + 1)
            console.log('the val is ', val)
            return Promise.resolve(val)
        },
        async (val) => {
            console.log('the val is ', val)
            return Promise.resolve(val)
        }
    ];

    const calc = (prev, curr) => {
        return prev.then(curr)
    }
    let total = 0
    await myAsyncFuncs.reduce(calc, Promise.resolve())
    .then(result => {
        console.log('RESULT is ' + total)  // prints "RESULT is 7"
    })
    .catch(error => {
        total = 'Error bruuuh'
    })
    console.log('sending result')
    res.send({
        data: total
    })
})

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

rootRouter
    .get('/inventory-transfers', [
        isAuth, authorize('owner'), inventoryTransferController.index
    ])       
    .get('/inventory-transfers/create', [
        isAuth, authorize('employee', 'owner'), inventoryTransferController.create
    ])       

module.exports = rootRouter