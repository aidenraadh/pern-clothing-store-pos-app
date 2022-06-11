import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    store_id: '',
    from: '',
    to: '',
    limit: 10, 
    offset: 0,      
}

const storeTransactionSlice = createSlice({
    name: 'storeTrnsc',
    initialState: {
        storeTrnscs: [],
        stores: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'storeTrnscs' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append storeTrnscs(s) to 'storeTrnscs'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...state.storeTrnscs, ...payload.storeTrnscs] : 
                    [...state.storeTrnscs, payload.storeTrnscs]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of storeTrnsc(s) to 'storeTrnscs'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeTrnscs: (
                    Array.isArray(payload.storeTrnscs) ? 
                    [...payload.storeTrnscs, ...state.storeTrnscs] : 
                    [payload.storeTrnscs, ...state.storeTrnscs]                
                ),
            };
        },
        // Replace a storeTrnsc inside 'storeTrnscs'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeTrnscs: (() => {
                    const storeTrnscs = [...state.storeTrnscs]
                    storeTrnscs[payload.index] = payload.storeTrnsc
                    return storeTrnscs
                })()
            };  
        },       
        // Remove storeTrnsc(s) from 'storeTrnscs'
        remove: (state, action) => {
            const payload = {...action.payload}
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
                ...state, storeTrnscs: payload.storeTrnscs,
                stores: payload.stores,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.storeTrnscs.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = storeTransactionSlice.actions
export default storeTransactionSlice.reducer