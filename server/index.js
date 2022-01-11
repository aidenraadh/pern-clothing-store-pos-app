require('dotenv').config()

const env          = process.env.NODE_ENV || 'development'
const config       = require('./config/app')[env]
const express      = require('express')
const cors         = require('cors')
const passport     = require('passport')
const initPassport = require('./config/passport')
const rootRouter   = require('./routes/index')
const app          = express()

app.use(cors({
    origin: config.clientUrl,
    credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
// Passport.js
app.use(passport.initialize())
initPassport(passport)

app.use('/', rootRouter)

app.get('/', (req, res) => {
    res.redirect(config['clientUrl'])
})

app.listen(config.serverPort, () => {
    console.log('Server started at port '+config.serverPort)
})