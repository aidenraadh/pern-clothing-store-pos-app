const env  = process.env.NODE_ENV || 'development'
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, `${env}.env`)
});

const config       = require('./config/app')[process.env.NODE_ENV]
const express      = require('express')
const cors         = require('cors')
const passport     = require('passport')
const initPassport = require('./config/passport')
const rootRouter   = require('./routes/index')
const app          = express()

if(env !== 'production'){
    app.use(cors({
        origin: config.clientUrl,
        credentials: true,
    }))
}

app.use(express.json())
app.use(express.urlencoded({extended: false}))
// Passport.js
app.use(passport.initialize())
initPassport(passport)

app.use('/api', rootRouter)

if(env === 'production'){
    // Your production configuration here ...  
}
else{
    app.get('/', (req, res) => {
        res.redirect(config['clientUrl'])
    })    
}

app.listen(config.port, () => {
    console.log('Server started at port '+config.port)
})