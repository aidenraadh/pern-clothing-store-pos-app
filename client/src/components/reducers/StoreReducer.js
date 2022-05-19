import { saveResFilters, getResFilters } from "../Utils";

export const FILTER_KEY = 'store'

export const INIT_STATE = {
    stores: null, // Array of stores
    storeTypes: {},
    canLoadMore: true, // Wheter or not the stores can be loaded more 
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const FILTER_ACTIONS = {
    UPDATE: 'UPDATE',
    RESET: 'RESET'
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
    if(type === FILTER_ACTIONS.RESET){
        saveResFilters(FILTER_KEY, payload.filters);
    }
    switch(type){
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        case FILTER_ACTIONS.RESET: 
            return {
                ...state, ...payload.filters
            };          
        // Error
        default: throw new Error()
    }
}

export const getFilters = () => {
    const defaultFilters = {
        name: '',
        limit: 10, 
        offset: 0,           
    }
    const filters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...filters}
}