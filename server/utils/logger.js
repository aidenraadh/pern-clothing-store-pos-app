const {createLogger, transports, format} = require('winston')

// const LOGS_PATH = 'storage/logs'

// const logger = createLogger({
//     transports: [
//         new transports.File({
//             filename: `${LOGS_PATH}/info.log`,
//             level: 'info',
//             format: format.combine(format.timestamp(), format.json())
//         }),
//         new transports.File({
//             filename: `${LOGS_PATH}/error.log`,
//             level: 'error',
//             format: format.combine(format.timestamp(), format.json())
//         })        
//     ]
// })

const buildDevLogger = () => {
    const logFormat = format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    });    
    return createLogger({
        format: format.combine(
            format.timestamp(), format.colorize(),
            logFormat
        ),
        transports: [new transports.Console()],
    })
}

const buildProdLogger = () => {
    const LOGS_PATH = 'storage/logs'

    return createLogger({
        transports: [
            new transports.File({
                filename: `${LOGS_PATH}/info.log`,
                level: 'info',
                format: format.combine(format.timestamp(), format.json())
            }),
            new transports.File({
                filename: `${LOGS_PATH}/error.log`,
                level: 'error',
                format: format.combine(format.timestamp(), format.json())
            })        
        ]        
    })
}

const logger = process.env.NODE_ENV === 'production' ? buildProdLogger() : buildDevLogger()

module.exports = logger
