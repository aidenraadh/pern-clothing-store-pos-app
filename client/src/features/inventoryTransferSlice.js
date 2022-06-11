import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    origin_store_id: '',
    destination_store_id: '',
    from: '',
    to: '',    
    limit: 10, 
    offset: 0,      
}

const inventoryTransferSlice = createSlice({
    name: 'invTransfer',
    initialState: {
        invTransfers: [],
        stores: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'invTransfers' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append invTransfers(s) to 'invTransfers'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, invTransfers: (
                    Array.isArray(payload.invTransfers) ? 
                    [...state.invTransfers, ...payload.invTransfers] : 
                    [...state.invTransfers, payload.invTransfers]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.invTransfers.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of invTransfer(s) to 'invTransfers'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, invTransfers: (
                    Array.isArray(payload.invTransfers) ? 
                    [...payload.invTransfers, ...state.invTransfers] : 
                    [payload.invTransfers, ...state.invTransfers]                
                ),
            };
        },
        // Replace a invTransfer inside 'invTransfers'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, invTransfers: (() => {
                    const invTransfers = [...state.invTransfers]
                    invTransfers[payload.index] = payload.invTransfer
                    return invTransfers
                })()
            };  
        },       
        // Remove invTransfer(s) from 'invTransfers'
        remove: (state, action) => {
            const payload = {...action.payload}
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
                    if(payload[index].key === 'shows_only'){
                        updatedFilters[payload[index].key] = (
                            payload[index].value === 'empty_production_selling' || payload[index].value === 'empty_sizes' ?
                            payload[index].value : ''
                        )
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
                ...state, invTransfers: payload.invTransfers,
                stores: payload.stores,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.invTransfers.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = inventoryTransferSlice.actions
export default inventoryTransferSlice.reducer