import { saveResFilters, getResFilters } from "../Utils";

export const FILTER_KEY = 'store_transaction'

export const INIT_STATE = {
    storeTrnscs: null, // Array of inventories
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

export const storeTransactionReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append store transaction(s) to 'store transactions'
        case ACTIONS.APPEND: 
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...state.storeTrnscs, ...payload.storeTrnscs] : 
                    [...state.storeTrnscs, payload.storeTrnscs]
                ),
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of store transaction(s) to 'store transactions'
        case ACTIONS.PREPEND: 
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...payload.storeTrnscs, ...state.storeTrnscs] : 
                    [payload.storeTrnscs, ...state.storeTrnscs]                
                ),

            };
        // Replace store transaction inside 'store transactions'
        case ACTIONS.REPLACE: 
            return {
                ...state, storeTrnscs: (() => {
                    const storeTrnscs = [...state.storeTrnscs]
                    storeTrnscs[payload.index] = payload.storeInv
                    return storeTrnscs
                })()
            };
        // Remove store transaction(s) from 'store transactions'
        case ACTIONS.REMOVE: 
            return {
                ...state, storeTrnscs: (() => {
                    let storeTrnscs = [...state.storeTrnscs]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {storeTrnscs.splice(index, 1)})
                        return storeTrnscs
                    }
                    storeTrnscs.splice(payload.indexes, 1)

                    return storeTrnscs
                })()
            }; 
        // Refresh the store transaction resource
        case ACTIONS.RESET: 
            return {
                ...state, storeTrnscs: [...payload.storeTrnscs],
                stores: payload.stores,
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true
            };             
        // Refresh the inventory resource
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
            if(payload.key === 'limit' || payload.key === 'store_id'){
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

export const getFilters = (fresh = false) => {
    const defaultFilters = {
        store_id: '',
        limit: 10, 
        offset: 0,           
    }
    if(fresh){
        return defaultFilters
    }
    const recentFilters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...recentFilters}
}