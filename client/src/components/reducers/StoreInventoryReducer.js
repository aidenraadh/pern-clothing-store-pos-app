import { saveResFilters } from "../Utils";

export const STOREINV_FILTER_KEY = 'store_inventory'

export const STOREINV_INIT_STATE = {
    storeInvs: null, // Array of inventories
    stores: [], // Array of stores
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
}
export const STOREINV_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
}

export const storeInventoryReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(STOREINV_FILTER_KEY, payload.filters);
    switch(type){
        // Append inventory(s) to 'inventories'
        case STOREINV_ACTIONS.APPEND: 
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...state.storeInvs, ...payload.storeInvs] : 
                    [...state.storeInvs, payload.storeInvs]
                ),
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory(s) to 'inventories'
        case STOREINV_ACTIONS.PREPEND: 
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...payload.storeInvs, ...state.storeInvs] : 
                    [payload.storeInvs, ...state.storeInvs]                
                ),

            };
        // Replace inventory inside 'inventories'
        case STOREINV_ACTIONS.REPLACE: 
            return {
                ...state, storeInvs: (() => {
                    const storeInvs = [...state.storeInvs]
                    storeInvs[payload.index] = payload.storeInv
                    return storeInvs
                })()
            };
        // Remove inventory(s) from 'inventories'
        case STOREINV_ACTIONS.REMOVE: 
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
        default: return {
            ...state, storeInvs: [...payload.storeInvs],
            stores: payload.stores,
            canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true
        };
    }
}