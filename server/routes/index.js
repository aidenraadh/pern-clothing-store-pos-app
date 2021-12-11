const env             = process.env.NODE_ENV || 'development'
const config          = require('../config/app')[env]
const rootRouter      = require('express').Router()
const authController  = require('../controllers/authController')
const userController  = require('../controllers/userController')
const storeController = require('../controllers/storeController')
const inventoryController = require('../controllers/inventoryController')
const isAuth          = require('../middlewares/isAuth')
const isNotAuth       = require('../middlewares/isNotAuth')
const validate        = require('../middlewares/validate')

const models = require('../models/index')
const User = models.User
const Role = models.Role
const logger = require('../utils/logger')

rootRouter.get('/', async (req, res) => {
    logger.error('error')
    logger.info('info')
    res.send('qwe');
})

rootRouter.post('/register', [
    isNotAuth, authController.registerRules, 
    validate, authController.register
])
rootRouter.post('/login', [
    isNotAuth, authController.login
])
rootRouter.get('/profile', [
    isAuth, userController.show
])
rootRouter.put('/profile', [
    isAuth, userController.updateRules, 
    validate, userController.update
])

rootRouter.post('/stores', [
    isAuth, storeController.storeRules, 
    validate, storeController.store
])

rootRouter.put('/stores/:id', [
    isAuth, storeController.updateRules, 
    validate, storeController.update
])

rootRouter.get('/inventories', [
    isAuth, inventoryController.index
])

rootRouter.post('/inventories', [
    isAuth, inventoryController.storeRules, 
    validate, inventoryController.store
])

rootRouter.put('/inventories/:id', [
    isAuth, inventoryController.updateRules, 
    validate, inventoryController.update
])


module.exports = rootRouter