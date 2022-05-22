import { getResFilters, saveResFilters } from "../Utils"

const STATE_NAME = 'inventory'

export const INIT_STATE = {
    inventories: [], // Array of inventories
    canLoadMore: true, // Whether or not the inventories can be loaded more 
    isLoaded: false, // Whether or not this state has been loaded
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


export const inventoryReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}

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
                isLoaded: true,
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true
            };             
        default: throw new Error();
    }
}

export const filterReducer = (state, action) => {
    const type = action.type
    const payload = {...action.payload}

    if(type === ACTIONS.FILTERS.RESET && payload.filters){
        saveResFilters(STATE_NAME, payload.filters)
    }
    switch (type) {
        case ACTIONS.FILTERS.UPDATE:
            if(payload.key === undefined || payload.value === undefined){
                throw new Error()
            }            
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
        case ACTIONS.FILTERS.RESET:
            if(payload.filters === undefined){
                return state
            }
            return {
                ...state, ...payload.filters
            };      
        default: throw new Error()
    }
}

/**
 * 
 * @param {Boolean} - Whether or not the store is already loaded 
 * @returns 
 */

export const getFilters = (isLoaded) => {
    const defaultFilters = {
        name: '',
        shows_only: '',
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