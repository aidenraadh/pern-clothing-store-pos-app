const rootRouter      = require('express').Router()
const authController  = require('../controllers/authController')
const userController  = require('../controllers/userController')
const storeController = require('../controllers/storeController')
const inventoryController = require('../controllers/inventoryController')
const isAuth          = require('../middlewares/isAuth')
const isNotAuth       = require('../middlewares/isNotAuth')

const joi = require('joi')

rootRouter.get('/', async (req, res) => {
    res.send('asd')
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

rootRouter.post('/stores', [
    isAuth, storeController.store
])

rootRouter.put('/stores/:id', [
    isAuth, storeController.update
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


module.exports = rootRouter