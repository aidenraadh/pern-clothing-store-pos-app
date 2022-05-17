import { saveResFilters, getResFilters } from "../Utils";

export const FILTER_KEY = 'invTransfer'

export const INIT_STATE = {
    invTransfers: null, // Array of invTransfers
    canLoadMore: true, // Wheter or not the invTransfers can be loaded more 
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
                canLoadMore: payload.invTransfers.length < payload.filters.limit ? false : true
            };             
        default: throw new Error();
    }
}

export const filterReducer = (state, action) => {
    const {type, payload} = action
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
        origin_store_id: '',
        destination_store_id: '',
        limit: 10, 
        offset: 0,           
    }
    const filters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...filters}
}