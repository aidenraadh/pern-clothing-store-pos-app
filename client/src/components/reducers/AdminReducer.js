import { saveResFilters, getResFilters } from "../Utils";

export const STATE_NAME = 'admin'

export const INIT_STATE = {
    admins: null, // Array of admins
    canLoadMore: true, // Whether or not the admins can be loaded more 
    isLoaded: false, // Whether or not store state has been loaded
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
    // Filters Actions
    FILTERS: {
        UPDATE: 'UPDATE',
        RESET: 'RESET'
    }  
}


export const adminReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}

    switch(type){
        // Append admin(s) to 'admins'
        case ACTIONS.APPEND: 
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...state.admins, ...payload.admins] : 
                    [...state.admins, payload.admins]
                ),
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of admin(s) to 'admins'
        case ACTIONS.PREPEND: 
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...payload.admins, ...state.admins] : 
                    [payload.admins, ...state.admins]                
                ),

            };
        // Replace admin inside 'admins'
        case ACTIONS.REPLACE: 
            return {
                ...state, admins: (() => {
                    const admins = [...state.admins]
                    admins[payload.index] = payload.admin
                    return admins
                })()
            };            
        // Remove admin(s) from 'admins'
        case ACTIONS.REMOVE: 
            return {
                ...state, admins: (() => {
                    let admins = [...state.admins]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {admins.splice(index, 1)})
                        return admins
                    }
                    admins.splice(payload.indexes, 1)

                    return admins
                })()
            }; 
        // Refresh the admin resource
        case ACTIONS.RESET: 
            return {
                ...state, admins: [...payload.admins],
                isLoaded: true,
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true
            };                        
        default: throw new Error();
    }
}

export const filterReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}
    // If the filter is resetted, save to the local storage
    if(type === ACTIONS.FILTERS.RESET && payload.filters){
        saveResFilters(STATE_NAME, payload.filters);
    }
    switch(type){
        case ACTIONS.FILTERS.UPDATE: 
            if(payload.key === undefined || payload.value === undefined){
                throw new Error()
            }        
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        case ACTIONS.FILTERS.RESET: 
            if(payload.filters ===  undefined){
                return state
            }  
            return {
                ...state, ...payload.filters
            };          
        // Error
        default: throw new Error()
    }
}

/**
 * 
 * @param {Boolean} - Whether or not the store state is already loaded 
 * @returns 
 */

export const getFilters = (isLoaded) => {
    const defaultFilters = {
        limit: 10, 
        offset: 0,
        role_id: 2,    
    }
    if(isLoaded === false){
        return defaultFilters
    }
    else if(isLoaded === true){
        const recentFilters = getResFilters(STATE_NAME)

        return {...defaultFilters, ...recentFilters}
    }
    else{
        throw new Error()
    }
}