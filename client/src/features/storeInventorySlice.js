import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,     
    store_id: '', 
    empty_size_only: false,
}

const storeInventorySlice = createSlice({
    name: 'storeInv',
    initialState: {
        storeInvs: [],
        stores: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'storeInvs' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append storeInvs(s) to 'storeInvs'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...state.storeInvs, ...payload.storeInvs] : 
                    [...state.storeInvs, payload.storeInvs]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of store inventory(s) to 'storeInvs'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeInvs: (
                    Array.isArray(payload.storeInvs) ? 
                    [...payload.storeInvs, ...state.storeInvs] : 
                    [payload.storeInvs, ...state.storeInvs]                
                ),
            };
        },
        // Replace a store inventory inside 'storeInvs'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, storeInvs: (() => {
                    const storeInvs = [...state.storeInvs]
                    storeInvs[payload.index] = payload.storeInv
                    return storeInvs
                })()
            };  
        },       
        // Remove store inventory(s) from 'storeInvs'
        remove: (state, action) => {
            const payload = {...action.payload}
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
        },
        // Update the 'filters'
        updateFilters: (state, action) => {
            const payload = {...action.payload}
            const filterKeys = Object.keys(filters)
            const updatedFilters = {...state.filters}
            console.log(payload)
            for (const index in payload) {
                // Make sure the filter key is exists
                if(filterKeys.includes(payload[index].key)){
                    updatedFilters[payload[index].key] = payload[index].value
                    // If the filter is limit or offset
                    if(payload[index].key === 'limit' || payload[index].key === 'offset'){
                        updatedFilters[payload[index].key] = parseInt(payload[index].value)
                    }       
                    if(payload[index].key === 'empty_size_only'){
                        updatedFilters[payload[index].key] = !payload[index].value
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
                ...state, storeInvs: payload.storeInvs,
                stores: payload.stores,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.storeInvs.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = storeInventorySlice.actions
export default storeInventorySlice.reducer