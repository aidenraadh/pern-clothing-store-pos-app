import axios from 'axios'
import {logout} from './Auth'

export const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || '/api',
    withCredentials: true,
    headers: {
        Authorization: localStorage.getItem(`jwt_token`)
    }    
})

// Handle errors from API request
export const errorHandler = (error, handler = {}) => {
	// Set default handler for unauthorized - 401
	handler['401'] = () => {logout()}
	// Set default handler for bad input - 400
	handler['400'] = handler['400'] ? handler['400'] : () => {
		alert(error.response.data.message)
	}	
	// Set default handler for server error - 500
	handler['500'] = handler['500'] ? handler['500'] : () => {
		alert(error.response.data.message)
	}
	// Call the handler if exists
	const statusCode = error.response.status.toString()
	if(handler[statusCode]){
		handler[statusCode]()
	}
	else{
		alert(error.response.data.message)
	}
}

/**
 * Get the query string from key-value pairs of queries
 * @param {object} queries - Key-value pairs of the queries
 * @returns {string}
 */

export const getQueryString = (queries) => {
	let arrString = []
	for(const key in queries){
		arrString.push(`${key}=${queries[key]}`)
	}
	return arrString.length ? `?${arrString.join('&')}` : ''
}

// Parse a JSON value if it can
// If its not a JSON value, return the original value
export function parseIfJson(data){
	let parsed = null;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        return data;
    }

    if(typeof parsed === 'object'){
    	return parsed;
    }

    return data;
}
// Parse a value to integer and return the integer
// If cant be parsed, return the original value
export function parseIfInt(value){
	const int = Number(value);
	if(value === '' || isNaN(int)) return value;
	return int;
}

export function formatNum(num, sanitizeOnly = false){
	// Return empty string if a number is not numeric
	if(num !== 0 && !num){
		return ''
	}
	num = num.toString().replace(/\D/g, '')
	num = num === '' ? '' : parseInt(num).toString()

	// Return only sanitezed number
	if(sanitizeOnly){ return num }
	
	// Convert num to string then to array
	num = num.split('');
	const price_length = num.length;

	if(price_length > 3){
		// Get the initial dot position
		let dot_pos = (price_length % 3 ? price_length % 3 : 3);
		// Add the dot to the initial position
		num.splice( dot_pos, 0, '.' );
		// Add the dot again to the next 3 zeros
		for (dot_pos += 4; dot_pos <= price_length; dot_pos += 4) {
			num.splice( dot_pos, 0, '.' );
		}
	}
	// Convert array to string.
	return num.join('');
}

export function getBaseName(fileUrl){
	return fileUrl.replace(/.*\//, '');
}

/**
 * 
 * @param {event} e 
 * @param {string} targetKey
 * @param {function} callback 
 */

export function keyHandler(e, targetKey, callback){
	if(e.key === targetKey){ callback() }
}