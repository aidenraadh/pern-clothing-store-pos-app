import { saveResFilters } from "../Utils";

export const INVENTORY_FILTER_KEY = 'inventory'

export const INVENTORY_INIT_STATE = {
    inventories: null, // Array of inventories
    canLoadMore: true, // Wheter or not the inventories can be loaded more 
}
export const INVENTORY_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const inventoryReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(INVENTORY_FILTER_KEY, payload.filters);

    switch(type){
        // Append inventory(s) to 'inventories'
        case INVENTORY_ACTIONS.APPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...state.inventories, ...payload.inventories] : 
                    [...state.inventories, payload.inventories]
                ),
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of inventory(s) to 'inventories'
        case INVENTORY_ACTIONS.PREPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...payload.inventories, ...state.inventories] : 
                    [payload.inventories, ...state.inventories]                
                ),

            };
        // Replace inventory inside 'inventories'
        case INVENTORY_ACTIONS.REPLACE: 
            return {
                ...state, inventories: (() => {
                    const inventories = [...state.inventories]
                    inventories[payload.index] = payload.inventory
                    return inventories
                })()
            };            
        // Remove inventory(s) from 'inventories'
        case INVENTORY_ACTIONS.REMOVE: 
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
        case INVENTORY_ACTIONS.RESET: 
            return {
                ...state, inventories: [...payload.inventories],
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true
            };             
        default: throw new Error();
    }
}