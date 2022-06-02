import { getResFilters, saveResFilters } from "../Utils"
import {format} from 'date-fns'

const STATE_NAME = 'invTransfer'

export const INIT_STATE = {
    invTransfers: null, // Array of invTransfers
    canLoadMore: true, // Wheter or not the invTransfers can be loaded more 
    isLoaded: false, // Whether or not this state already loaded
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
    FILTERS: {
        UPDATE: 'UPDATE',
        RESET: 'RESET'        
    }
}


export const inventoryTransferReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append inventory transfer(s) to 'invTransfers'
        case ACTIONS.APPEND: 
            return {
                ...state, invTransfers: (
                    Array.isArray(payload.invTransfers) ? 
                    [...state.invTransfers, ...payload.invTransfers] : 
                    [...state.invTransfers, payload.invTransfers]
                ),
                canLoadMore: payload.invTransfers.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory transfer(s) to 'invTransfers'
        case ACTIONS.PREPEND: 
            return {
                ...state, invTransfers: (
                    Array.isArray(payload.invTransfers) ? 
                    [...payload.invTransfers, ...state.invTransfers] : 
                    [payload.invTransfers, ...state.invTransfers]                
                ),

            };
        // Replace inventory inside 'invTransfers'
        case ACTIONS.REPLACE: 
            return {
                ...state, invTransfers: (() => {
                    const invTransfers = [...state.invTransfers]
                    invTransfers[payload.index] = payload.invTransfer
                    return invTransfers
                })()
            };            
        // Remove inventory transfer(s) from 'invTransfers'
        case ACTIONS.REMOVE: 
            return {
                ...state, invTransfers: (() => {
                    let invTransfers = [...state.invTransfers]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {invTransfers.splice(index, 1)})
                        return invTransfers
                    }
                    invTransfers.splice(payload.indexes, 1)

                    return invTransfers
                })()
            }; 
        // Refresh the inventory resource
        case ACTIONS.RESET: 
            return {
                ...state, invTransfers: [...payload.invTransfers],
                stores: payload.stores,
                isLoaded: true,
                canLoadMore: payload.invTransfers.length < payload.filters.limit ? false : true
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
            if(payload.key === 'from' || payload.key === 'to'){
                payload.value = payload.value ? format(new Date(payload.value), 'yyyy-MM-dd') : ''
            }             
            return {
                ...state, [payload.key]: payload.value
            }; 
        case ACTIONS.FILTERS.RESET: 
            if(payload.filters){
                payload.filters.from = payload.filters.from ? format(new Date(payload.filters.from), 'yyyy-MM-dd') : ''
                payload.filters.to = payload.filters.to ? format(new Date(payload.filters.to), 'yyyy-MM-dd') : ''                
                return {
                    ...state, ...payload.filters
                }; 
            }      
            return state   
        // Error
        default: throw new Error()
    }
}

export const getFilters = (isLoaded) => {
    const defaultFilters = {
        name: '',
        origin_store_id: '',
        destination_store_id: '',
        from: '',
        to: '',
        limit: 10, 
        offset: 0,           
    }
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