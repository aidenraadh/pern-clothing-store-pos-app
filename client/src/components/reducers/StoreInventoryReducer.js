import { getResFilters, saveResFilters } from "../Utils"

const STATE_NAME = 'storeInv'

export const INIT_STATE = {
    storeInvs: null, // Array of inventories
    stores: [], // Array of stores
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
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

export const storeInventoryReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}

    switch(type){
        // Append inventory(s) to 'inventories'
        case ACTIONS.APPEND: 
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...state.storeInvs, ...payload.storeInvs] : 
                    [...state.storeInvs, payload.storeInvs]
                ),
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory(s) to 'inventories'
        case ACTIONS.PREPEND: 
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...payload.storeInvs, ...state.storeInvs] : 
                    [payload.storeInvs, ...state.storeInvs]                
                ),

            };
        // Replace inventory inside 'inventories'
        case ACTIONS.REPLACE: 
            return {
                ...state, storeInvs: (() => {
                    const storeInvs = [...state.storeInvs]
                    storeInvs[payload.index] = payload.storeInv
                    return storeInvs
                })()
            };
        // Remove inventory(s) from 'inventories'
        case ACTIONS.REMOVE: 
            return {
                ...state, storeInvs: (() => {
                    let storeInvs = [...state.storeInvs]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {storeInvs.splice(index, 1)})
                        return storeInvs
                    }
                    storeInvs.splice(payload.indexes, 1)

                    return storeInvs
                })()
            };       
        // Refresh the inventory resource
        case ACTIONS.RESET: 
            return {
                ...state, storeInvs: [...payload.storeInvs],
                stores: payload.stores,
                isLoaded: true,
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true
            };            
        default: throw new Error()
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
            if(payload.key === 'limit' || payload.key === 'store_id'){
                payload.value = parseInt(payload.value)
            }
            if(payload.key === 'empty_size_only'){
                payload.value = !payload.value
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
        store_id: '',
        empty_size_only: false,
        limit: 10, 
        offset: 0,      
    }
    // When the onventory
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