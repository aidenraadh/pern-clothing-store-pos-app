import { getResFilters, saveResFilters } from "../Utils"
import {format} from 'date-fns'

const STATE_NAME = 'storeTrnsc'

export const INIT_STATE = {
    storeTrnscs: [], // Array of store transactions
    stores: [], // Array of stores
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
    isLoaded: false, // Whether or not this state has been loaded
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    UPDATE_FILTERS: 'UPDATE_FILTERS',
    RESET: 'RESET',
    // Filters Actions
    FILTERS: {
        UPDATE: 'UPDATE',
        RESET: 'RESET'
    }    
}

export const storeTransactionReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}

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
                isLoaded: true,
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true
            };             
        // Refresh the inventory resource
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
            if(payload.key === 'limit' || payload.key === 'store_id'){
                payload.value = parseInt(payload.value)
            }
            if(payload.key === 'from' || payload.key === 'to'){
                payload.value = payload.value ? format(new Date(payload.value), 'yyyy-MM-dd') : ''
            }            
            return {
                ...state, [payload.key]: payload.value
            }          
        case ACTIONS.FILTERS.RESET:
            if(payload.filters){
                payload.filters.from = payload.filters.from ? format(new Date(payload.filters.from), 'yyyy-MM-dd') : ''
                payload.filters.to = payload.filters.to ? format(new Date(payload.filters.to), 'yyyy-MM-dd') : ''
                return {
                    ...state, ...payload.filters
                }; 
            }
            return state     
        default: throw new Error()
    }
}

/**
 * 
 * @param {Boolean} - Whether or not this state is already loaded 
 * @returns 
 */

export const getFilters = (isLoaded) => {
    const defaultFilters = {
        store_id: '',
        from: '',
        to: '',
        limit: 10, 
        offset: 0,    
    }
    // When the onventory
    if(isLoaded === false){
        return defaultFilters
    }
    else if(isLoaded === true){
        const recentFilters = getResFilters(STATE_NAME)
        const filters = {...defaultFilters, ...recentFilters}
        filters.from = filters.from ? format(new Date(filters.from), 'yyyy-MM-dd') : ''
        filters.to = filters.to ? format(new Date(filters.to), 'yyyy-MM-dd') : ''     
        return filters
    }
    else{
        throw new Error()
    }
}