import { saveResFilters, getResFilters } from "../Utils";

export const STATE_NAME = 'store'

export const INIT_STATE = {
    stores: [], // Array of stores
    storeTypes: {},
    canLoadMore: true, // Wheter or not the stores can be loaded more 
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

export const storeReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append store(s) to 'stores'
        case ACTIONS.APPEND: 
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...state.stores, ...payload.stores] : 
                    [...state.stores, payload.stores]
                ),
                canLoadMore: payload.stores.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of store(s) to 'stores'
        case ACTIONS.PREPEND: 
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...payload.stores, ...state.stores] : 
                    [payload.stores, ...state.stores]                
                ),

            };
        // Replace store inside 'stores'
        case ACTIONS.REPLACE: 
            return {
                ...state, stores: (() => {
                    const stores = [...state.stores]
                    stores[payload.index] = payload.store
                    return stores
                })()
            };            
        // Remove store(s) from 'stores'
        case ACTIONS.REMOVE: 
            return {
                ...state, stores: (() => {
                    let stores = [...state.stores]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {stores.splice(index, 1)})
                        return stores
                    }
                    stores.splice(payload.indexes, 1)

                    return stores
                })()
            }; 
        // Reset store(s) from 'stores'
        case ACTIONS.RESET: 
            return {
                ...state, stores: [...payload.stores],
                storeTypes: payload.storeTypes,
                isLoaded: true,
                canLoadMore: payload.stores.length < payload.filters.limit ? false : true
            };             
        // Error
        default: throw new Error()
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
        name: '',
        limit: 10, 
        offset: 0,           
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