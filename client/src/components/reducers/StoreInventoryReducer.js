import { saveResFilters, getResFilters } from "../Utils";

export const FILTER_KEY = 'store_inventory'

export const INIT_STATE = {
    storeInvs: null, // Array of inventories
    stores: [], // Array of stores
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

export const storeInventoryReducer = (state, action) => {
    const {type, payload} = action

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
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true
            };            
        default: throw new Error()
    }
}

export const filterReducer = (state, action) => {
    const {type, payload} = action
    // If the filter is resetted, save to the local storage
    if(type === FILTER_ACTIONS.RESET){
        saveResFilters(FILTER_KEY, payload.filters);
    }
    switch(type){
        // Append room type(s) to 'roomTypes'
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit' || payload.key === 'store_id'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        // Prepend array of room types(s) to 'roomTypes'
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
        store_id: '',
        limit: 10, 
        offset: 0,           
    }
    const filters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...filters}
}