import axios from 'axios'
import {logout} from './Auth'

export const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL,
    withCredentials: true,
    headers: {
        Authorization: localStorage.getItem('jwt_token')
    }    
})

// Handle errors from API request
export const errorHandler = (error, callbacks = {}) => {
	callbacks['401'] = () => {logout()}
	callbacks['500'] = () => {alert(error.response.data.message)}   
	for(const status in callbacks){
		if(parseInt(error.response.status) === 401){ callbacks['401']() }
		if(parseInt(error.response.status) === 500){ callbacks['500']() }
		if(parseInt(error.response.status) === parseInt(status)){ callbacks[status]() }
	} 
}

/**
 * Save the resource's index filters
 * @param {string} key - The filter key of the resource
 * @param {object} filters - Key-value pairs of the filters
 */

export const saveResFilters = (key, filters) => {
	let resourceFilters = localStorage.getItem('resource_filters')
	filters = filters ? {...filters} : {}
	// Create resource_filter storage if it not exist
	if(!resourceFilters){
		resourceFilters = {}
	}
	else{
		resourceFilters = JSON.parse(resourceFilters)
	}
	resourceFilters[key] = {...filters}
	localStorage.setItem('resource_filters', JSON.stringify(resourceFilters))
}

/**
 * Get the resource's filters
 * @param {*} key - The filter key of the resource
 * @returns {object} - The resource's filters
 */

export const getResFilters = (key) => {
	let resourceFilters = localStorage.getItem('resource_filters')
	if(!resourceFilters){
		resourceFilters = {}
	}
	else{
		resourceFilters = JSON.parse(resourceFilters)
	}
	return resourceFilters[key] ? resourceFilters[key] : {}
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

export function getBaseName(file_url){
	return file_url.replace(/.*\//, '');
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

// export function initDropzone(id, form_name = 'file', request_urls, request_headers = {}, settings = {}){
// 	// Remove previously created dropozone hidden input
// 	let dz_hidden_inputs = document.querySelectorAll('input.dz-hidden-input');
// 	dz_hidden_inputs.forEach((input) => {
// 		input.remove();
// 	});

// 	const dropzone = new Dropzone('#'+id, {
// 		url: request_urls.store,
// 		headers: (request_headers.store ? request_headers.store : {}),
// 		paramName: form_name,
// 		maxFiles: (settings.max_files ? settings.max_files : null),
// 		addRemoveLinks: true,
// 		dictRemoveFile: '&times; Remove file',
// 		accept: function(file, done){
// 			const uploaded_files = this.files;
// 			const uploaded_filenames = uploaded_files.map((uploaded_file, index) => {
// 				if(index < uploaded_files.length - 1){
// 					return uploaded_file.name;
// 				}
// 			});
// 			if( uploaded_filenames.includes(file.name) ){
// 				done(['Cant upload file with a same name']);
// 			}
// 			else { done(); }
// 		},
// 		error: function(file, errors){
// 			alert(errors);
// 			this.removeFile(file);
// 		},
// 	});

// 	dropzone.on('sending', (file, xhr, form_data) => {
// 		form_data.append('timestamp', settings.timestamp);
// 		form_data.append('disk', settings.disk);
// 		if(settings.max_files){
// 			form_data.append('max_files', settings.max_files);
// 		}
// 	});

// 	dropzone.on('removedfile', (file) => {
// 		const data = {
// 			filename: file.name,
// 			timestamp: settings.timestamp,
// 			disk: settings.disk,
// 		}
// 		xhttpPost(
// 			serializeObj(data),request_urls.delete,
// 			(request_headers.delete ? request_headers.delete : {}) ,
// 		);
// 	});

// 	xhttpPost(
// 		'timestamp='+settings.timestamp,
// 		request_urls.restart,
// 		request_headers.restart
// 	);	

// 	return dropzone;
// }

// // Remove all files and thumnails in the dropzone
// export function resetDropzone(dropzone){
// 	const previewEl = dropzone.element.childNodes;
// 	dropzone.removeAllFiles();

// 	previewEl.forEach((el) => {
// 		if(el.classList.contains('dz-preview')){
// 			el.remove();
// 		}
// 	});	
// }
