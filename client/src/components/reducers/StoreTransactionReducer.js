import { saveResFilters } from "../Utils";

export const STORETRNSC_FILTER_KEY = 'store_transaction'

export const STORETRNSC_INIT_STATE = {
    storeTrnsc: null, // Array of inventories
    stores: [], // Array of stores
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
}
export const STORETRNSC_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
}

export const storeTransactionReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(STORETRNSC_FILTER_KEY, payload.filters);
    switch(type){
        // Append inventory(s) to 'inventories'
        case STORETRNSC_ACTIONS.APPEND: 
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...state.storeTrnscs, ...payload.storeTrnscs] : 
                    [...state.storeTrnscs, payload.storeTrnscs]
                ),
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory(s) to 'inventories'
        case STORETRNSC_ACTIONS.PREPEND: 
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...payload.storeTrnscs, ...state.storeTrnscs] : 
                    [payload.storeTrnscs, ...state.storeTrnscs]                
                ),

            };
        // Replace inventory inside 'inventories'
        case STORETRNSC_ACTIONS.REPLACE: 
            return {
                ...state, storeTrnscs: (() => {
                    const storeTrnscs = [...state.storeTrnscs]
                    storeTrnscs[payload.index] = payload.storeInv
                    return storeTrnscs
                })()
            };
        // Remove inventory(s) from 'inventories'
        case STORETRNSC_ACTIONS.REMOVE: 
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
        // Refresh the inventory resource
        default: return {
            ...state, storeTrnscs: [...payload.storeTrnscs],
            stores: payload.stores,
            canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true
        };
    }
}