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
const logger                  = require('../utils/logger')


const haha = () => {
    try {
        if(1 === 1){
            throw new Error('Yoo error')
        }
        return 'qqqqq'
    } catch (error) {
        throw error
    }
}

rootRouter.get('/new-owner', async (req, res) => {
    try {
        logger.info('asd')
        const x = haha()
        res.status(200).send({message: 'complete'})
    } catch (error) {
        logger.error(error, {errorObj: error})
        res.status(500).send({message: error.message})
    }
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
    // return res.send({message: 'asd'})
})

rootRouter.get('/test', async (req, res) => {
    // User.update(
    //     {password: await bcrypt.hash('12345678', 10)},
    //     {where: {id: 1}}
    // )
    return res.send({message: 'asd'})
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