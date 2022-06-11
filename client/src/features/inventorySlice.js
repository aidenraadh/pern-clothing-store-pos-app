import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    shows_only: '',
    not_in_store: '',
    limit: 10, 
    offset: 0,      
}

const inventorySlice = createSlice({
    name: 'inventory',
    initialState: {
        inventories: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'inventories' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append inventories(s) to 'inventories'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...state.inventories, ...payload.inventories] : 
                    [...state.inventories, payload.inventories]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of inventory(s) to 'inventories'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, inventories: (
                    Array.isArray(payload.inventories) ? 
                    [...payload.inventories, ...state.inventories] : 
                    [payload.inventories, ...state.inventories]                
                ),
            };
        },
        // Replace a inventory inside 'inventories'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, inventories: (() => {
                    const inventories = [...state.inventories]
                    inventories[payload.index] = payload.inventory
                    return inventories
                })()
            };  
        },       
        // Remove inventory(s) from 'inventories'
        remove: (state, action) => {
            const payload = {...action.payload}
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
                ...state, inventories: payload.inventories,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.inventories.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = inventorySlice.actions
export default inventorySlice.reducer