import { saveResFilters } from "../Utils";

export const INVENTORY_FILTER_KEY = 'inventory'

export const INVENTORY_INIT_STATE = {
    inventories: [], // Array of inventories
}
export const INVENTORY_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND', 
    REMOVE: 'REMOVE'
}

export const inventoryReducer = (state, action) => {
    saveResFilters(INVENTORY_FILTER_KEY, action.payload.filters);

    switch(action.type){
        // Append inventory(s) to 'inventories'
        case INVENTORY_ACTIONS.APPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(action.payload.inventories) ? 
                    [...action.payload.inventories, ...state.inventories] : 
                    [action.payload.inventories, ...state.inventories]
                ) 
            }; 
            break;
        // Prepend array of inventory(s) to 'inventories'
        case INVENTORY_ACTIONS.PREPEND: 
            return {
                ...state, inventories: (
                    Array.isArray(action.payload.inventories) ? 
                    [...state.inventories, ...action.payload.inventories] : 
                    [...state.inventories, action.payload.inventories]                
                )
            };
            break;
        // Remove inventory(s) from 'inventories'
        case INVENTORY_ACTIONS.REMOVE: 
            return {
                ...state, inventories: (() => {
                    let inventories = [...state.inventories]
                    if(Array.isArray(indexes)){
                        action.payload.indexes.forEach(index => {inventories.splice(index, 1)})
                        return inventories
                    }
                    inventories.splice(indexes, 1)

                    return inventories
                })()
            }; 
            break;
        // Refresh the inventory resource
        default: return {
            inventories: action.payload.inventories
        };
    }
}