import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    role_id: 2,
    limit: 10, 
    offset: 0,      
}

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        admins: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'admins' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append admins(s) to 'admins'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...state.admins, ...payload.admins] : 
                    [...state.admins, payload.admins]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of admin(s) to 'admins'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, admins: (
                    Array.isArray(payload.admins) ? 
                    [...payload.admins, ...state.admins] : 
                    [payload.admins, ...state.admins]                
                ),
            };
        },
        // Replace a admin inside 'admins'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, admins: (() => {
                    const admins = [...state.admins]
                    admins[payload.index] = payload.admin
                    return admins
                })()
            };  
        },       
        // Remove admin(s) from 'admins'
        remove: (state, action) => {
            const payload = {...action.payload}
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
                ...state, admins: payload.admins,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.admins.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = adminSlice.actions
export default adminSlice.reducer