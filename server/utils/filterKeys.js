const logger = require('../utils/logger')

/**
 * Get only specific key from request body
 * 
 * @param {*object} object - The request body
 * @param {*array} keys    - Keys to get
 * @returns {*object}
 */

const filterKeys = (object, keys) => {
    try {
        object = {...object}
        let data = {}
    
        keys.forEach(key => {
            if(object.hasOwnProperty(key)){
                data[key] = object[key]       
            }
        })
        return data        
    } catch (err) {
        throw err
    }
}

module.exports = filterKeys