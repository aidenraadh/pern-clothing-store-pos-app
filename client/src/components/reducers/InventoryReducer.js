import { saveResFilters, getResFilters } from "../Utils";

export const FILTER_KEY = 'inventory'

export const INIT_STATE = {
    inventories: null, // Array of inventories
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
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


export const inventoryReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append inventory(s) to 'inventories'
        case ACTIONS.APPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...state.inventories, ...payload.inventories] : 
                    [...state.inventories, payload.inventories]
                ),
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory(s) to 'inventories'
        case ACTIONS.PREPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...payload.inventories, ...state.inventories] : 
                    [payload.inventories, ...state.inventories]                
                ),

            };
        // Replace inventory inside 'inventories'
        case ACTIONS.REPLACE: 
            return {
                ...state, inventories: (() => {
                    const inventories = [...state.inventories]
                    inventories[payload.index] = payload.inventory
                    return inventories
                })()
            };            
        // Remove inventory(s) from 'inventories'
        case ACTIONS.REMOVE: 
            return {
                ...state, inventories: (() => {
                    let inventories = [...state.inventories]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {inventories.splice(index, 1)})
                        return inventories
                    }
                    inventories.splice(payload.indexes, 1)

                    return inventories
                })()
            }; 
        // Refresh the inventory resource
        case ACTIONS.RESET: 
            return {
                ...state, inventories: [...payload.inventories],
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true
            };             
        default: throw new Error();
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
            if(payload.key === 'shows_only'){
                payload.value = (
                    payload.value === 'empty_production_selling' || payload.value === 'empty_sizes' ?
                    payload.value : ''
                )
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

export const getFilters = (fresh = false) => {
    const defaultFilters = {
        name: '',
        shows_only: '',
        limit: 10, 
        offset: 0,           
    }
    if(fresh){
        return defaultFilters
    }
    const recetFilters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...recetFilters}
}