module.exports = {
    development: {
        serverPort: process.env.DEV_SERVER_PORT || '7000',
        clientUrl: process.env.DEV_CLIENT_URL || 'http://localhost:3000'
    },
    test: {
        serverPort: '',
        clientUrl: ''
    },
    production: {
        serverPort: '',
        clientUrl: ''
    }
}
