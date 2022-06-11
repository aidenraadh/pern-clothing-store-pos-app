import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    role_id: 3,
    limit: 10, 
    offset: 0,      
}

const employeeSlice = createSlice({
    name: 'employee',
    initialState: {
        employees: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'employees' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append employees(s) to 'employees'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...state.employees, ...payload.employees] : 
                    [...state.employees, payload.employees]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.employees.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of employee(s) to 'employees'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...payload.employees, ...state.employees] : 
                    [payload.employees, ...state.employees]                
                ),
            };
        },
        // Replace a employee inside 'employees'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, employees: (() => {
                    const employees = [...state.employees]
                    employees[payload.index] = payload.employee
                    return employees
                })()
            };  
        },       
        // Remove employee(s) from 'employees'
        remove: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, employees: (() => {
                    let employees = [...state.employees]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {employees.splice(index, 1)})
                        return employees
                    }
                    employees.splice(payload.indexes, 1)

                    return employees
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
                ...state, employees: payload.employees,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.employees.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = employeeSlice.actions
export default employeeSlice.reducer