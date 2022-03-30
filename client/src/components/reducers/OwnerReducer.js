import { saveResFilters } from "../Utils";

export const OWNER_FILTER_KEY = 'owner'

export const OWNER_INIT_STATE = {
    owners: null, // Array of owners
    canLoadMore: true, // Whether or not the owners can be loaded more 
}
export const OWNER_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
}

export const ownerReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(OWNER_FILTER_KEY, payload.filters);

    switch(type){
        // Append owner(s) to 'owners'
        case OWNER_ACTIONS.APPEND: 
            return {
                ...state, owners: (
                    Array.isArray(payload.owners) ? 
                    [...state.owners, ...payload.owners] : 
                    [...state.owners, payload.owners]
                ),
                canLoadMore: payload.owners.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of owner(s) to 'owners'
        case OWNER_ACTIONS.PREPEND: 
            return {
                ...state, owners: (
                    Array.isArray(payload.owners) ? 
                    [...payload.owners, ...state.owners] : 
                    [payload.owners, ...state.owners]                
                ),

            };
        // Replace owner inside 'owners'
        case OWNER_ACTIONS.REPLACE: 
            return {
                ...state, owners: (() => {
                    const owners = [...state.owners]
                    owners[payload.index] = payload.owner
                    return owners
                })()
            };            
        // Remove owner(s) from 'owners'
        case OWNER_ACTIONS.REMOVE: 
            return {
                ...state, owners: (() => {
                    let owners = [...state.owners]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {owners.splice(index, 1)})
                        return owners
                    }
                    owners.splice(payload.indexes, 1)

                    return owners
                })()
            }; 
        // Refresh the owner resource
        default: return {
            ...state, owners: [...payload.owners],
            canLoadMore: payload.owners.length < payload.filters.limit ? false : true
        };
    }
}