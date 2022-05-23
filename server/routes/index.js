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


const Joi                      = require('joi')

const sequelize = require('sequelize')
const models = require('../models/index')
const filterKeys = require('../utils/filterKeys')
const StoreInventory = models.StoreInventory
const Inventory = models.Inventory
const InventorySize = models.InventorySize
const Store = models.Store
const User = models.User
const bcrypt        = require('bcrypt')
const Owner = models.Owner



rootRouter.get('/add-owner', async (req, res) => {
    try {
        let user = null


        // const owner = await Owner.create({})
        // const userData = {
        //     name: 'Test admin A', email: 'testadmina@gmail.com',
        //     password: await bcrypt.hash(
        //         '12345678', 10
        //     ),
        //     owner_id: owner.id,
        //     role_id: 2,
        //     language_id: 1
        // }       
        // user = await User.create(userData)
        
        res.send({
            data: user,
            message: 'new user created'
        })        
    } catch (err) {
        res.status(500).send({message: err.message})
    }        
})


rootRouter.get('/hehe', async (req, res) => {
    try {
        const filters = {}

        filters.whereInv = `"owner_id"=${1} AND 
        NOT EXISTS (SELECT id FROM "Store_Inventories" WHERE "inventory_id"="Inventory"."id")`
        filters.whereInv = sequelize.literal(filters.whereInv)

        const inventories = await Inventory.findAll({
            attributes: ['id', 'name'],
            where: filters.whereInv,
            include: [{
                model: InventorySize, as: 'sizes', 
                attributes: ['id', 'name', 'production_price', 'selling_price'],
                required: filters.requiredInvSizes,
                where: filters.whereInvSizes
            }],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            data: inventories
        })        
    } catch (err) {
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