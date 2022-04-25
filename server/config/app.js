const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`)
});

module.exports = {
    development: {
        port: process.env.PORT || '7000',
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
    },
    test: {
        port: process.env.PORT,
        clientUrl: process.env.CLIENT_URL
    },
    production: {
        port: process.env.PORT,
        clientUrl: process.env.CLIENT_URL
    }
}