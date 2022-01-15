import { saveResFilters } from "../Utils";

export const STORE_FILTER_KEY = 'store'

export const STORE_INIT_STATE = {
    stores: null, // Array of stores
    canLoadMore: true, // Wheter or not the stores can be loaded more 
}
export const STORE_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
}

export const storeReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(STORE_FILTER_KEY, payload.filters);

    switch(type){
        // Append store(s) to 'stores'
        case STORE_ACTIONS.APPEND: 
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...state.stores, ...payload.stores] : 
                    [...state.stores, payload.stores]
                ),
                canLoadMore: payload.stores.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of store(s) to 'stores'
        case STORE_ACTIONS.PREPEND: 
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...payload.stores, ...state.stores] : 
                    [payload.stores, ...state.stores]                
                ),

            };
        // Replace store inside 'stores'
        case STORE_ACTIONS.REPLACE: 
            return {
                ...state, stores: (() => {
                    const stores = [...state.stores]
                    stores[payload.index] = payload.store
                    return stores
                })()
            };            
        // Remove store(s) from 'stores'
        case STORE_ACTIONS.REMOVE: 
            return {
                ...state, stores: (() => {
                    let stores = [...state.stores]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {stores.splice(index, 1)})
                        return stores
                    }
                    stores.splice(payload.indexes, 1)

                    return stores
                })()
            }; 
        // Refresh the store resource
        default: return {
            ...state, stores: [...payload.stores],
            canLoadMore: payload.stores.length < payload.filters.limit ? false : true
        };
    }
}