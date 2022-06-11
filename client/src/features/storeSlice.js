import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,      
}

const storeSlice = createSlice({
    name: 'store',
    initialState: {
        stores: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'stores' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append stores(s) to 'stores'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...state.stores, ...payload.stores] : 
                    [...state.stores, payload.stores]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.stores.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of store(s) to 'stores'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, stores: (
                    Array.isArray(payload.stores) ? 
                    [...payload.stores, ...state.stores] : 
                    [payload.stores, ...state.stores]                
                ),
            };
        },
        // Replace a store inside 'stores'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, stores: (() => {
                    const stores = [...state.stores]
                    stores[payload.index] = payload.store
                    return stores
                })()
            };  
        },       
        // Remove store(s) from 'stores'
        remove: (state, action) => {
            const payload = {...action.payload}
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
        },
        // Update the 'filters'
        updateFilters: (state, action) => {
            const payload = {...action.payload}
            const filterKeys = Object.keys(filters)
            const updatedFilters = {...state.filters}
            for (const index in payload) {
                // Make sure the filter key is exists
                if(filterKeys.includes(payload[index].key)){
                    updatedFilters[payload[index].key] = payload[index].value
                    // If the filter is limit or offset
                    if(payload[index].key === 'limit' || payload[index].key === 'offset'){
                        updatedFilters[payload[index].key] = parseInt(payload[index].value)
                    }                       
                }                  
            }
            return {...state, filters: {...state.lastFilters, ...updatedFilters}}
        },   
        // Sync 'filters' with 'lastFilters'
        syncFilters: (state, action) => {
            return {...state, filters: {...state.lastFilters}}
        },
        // Reset this state with new fresh data
        reset: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, stores: payload.stores,
                storeTypes: payload.storeTypes,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.stores.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = storeSlice.actions
export default storeSlice.reducer