import { saveResFilters, getResFilters } from "../Utils";

export const INIT_STATE = {
    admins: null, // Array of admins
    canLoadMore: true, // Whether or not the admins can be loaded more 
    filters: {
        limit: 10, 
        offset: 0,   
    },
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
    UPDATE_FILTERS: 'UPDATE_FILTERS',
}


export const adminReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append admin(s) to 'admins'
        case ACTIONS.APPEND: 
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...state.admins, ...payload.admins] : 
                    [...state.admins, payload.admins]
                ),
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of admin(s) to 'admins'
        case ACTIONS.PREPEND: 
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...payload.admins, ...state.admins] : 
                    [payload.admins, ...state.admins]                
                ),

            };
        // Replace admin inside 'admins'
        case ACTIONS.REPLACE: 
            return {
                ...state, admins: (() => {
                    const admins = [...state.admins]
                    admins[payload.index] = payload.admin
                    return admins
                })()
            };            
        // Remove admin(s) from 'admins'
        case ACTIONS.REMOVE: 
            return {
                ...state, admins: (() => {
                    let admins = [...state.admins]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {admins.splice(index, 1)})
                        return admins
                    }
                    admins.splice(payload.indexes, 1)

                    return admins
                })()
            }; 
        // Refresh the admin resource
        case ACTIONS.RESET: 
            return {
                ...state, admins: [...payload.admins],
                filters: [...payload.filters],
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true
            };        
        // Update the admin filters
        case ACTIONS.UPDATE_FILTERS: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, filters: {...state.filters, [payload.key]: payload.value}
            };                 
        default: throw new Error();
    }
}