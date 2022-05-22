import { saveResFilters, getResFilters } from "../Utils";

export const STATE_NAME = 'employee'

export const EMPLOYEE_INIT_STATE = {
    employees: [], // Array of employees
    canLoadMore: true, // Whether or not the employees can be loaded more
    isLoaded: false, // Whether or not store state has been loaded 
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
    // Filters Actions
    FILTERS: {
        UPDATE: 'UPDATE',
        RESET: 'RESET'
    }      
}

export const employeeReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}

    switch(type){
        // Append employee(s) to 'employees'
        case ACTIONS.APPEND: 
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...state.employees, ...payload.employees] : 
                    [...state.employees, payload.employees]
                ),
                canLoadMore: payload.employees.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of employee(s) to 'employees'
        case ACTIONS.PREPEND: 
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...payload.employees, ...state.employees] : 
                    [payload.employees, ...state.employees]                
                ),
            };
        // Replace employee inside 'employees'
        case ACTIONS.REPLACE: 
            console.log(payload.index)
            console.log(payload.employee)
            return {
                ...state, employees: (() => {
                    const employees = [...state.employees]
                    employees[payload.index] = payload.employee
                    return employees
                })()
            };            
        // Remove employee(s) from 'employees'
        case ACTIONS.REMOVE: 
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
        // Refresh the employee resource            
        case ACTIONS.RESET: 
            return {
                ...state, employees: [...payload.employees],
                isLoaded: true,
                canLoadMore: payload.employees.length < payload.filters.limit ? false : true
            };             
        default: throw new Error();
    }
}

export const filterReducer = (state, action) => {
    const type= action.type
    const payload = {...action.payload}
    // If the filter is resetted, save to the local storage
    if(type === ACTIONS.FILTERS.RESET && payload.filters){
        saveResFilters(STATE_NAME, payload.filters);
    }
    switch(type){
        case ACTIONS.FILTERS.UPDATE: 
            if(payload.key === undefined || payload.value === undefined){
                throw new Error()
            }        
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        case ACTIONS.FILTERS.RESET: 
            if(payload.filters ===  undefined){
                return state
            }  
            return {
                ...state, ...payload.filters
            };          
        // Error
        default: throw new Error()
    }
}

/**
 * 
 * @param {Boolean} - Whether or not the store state is already loaded 
 * @returns 
 */

export const getFilters = (isLoaded) => {
    const defaultFilters = {
        limit: 10, 
        offset: 0,
        role_id: 3,    
    }
    if(isLoaded === false){
        return defaultFilters
    }
    else if(isLoaded === true){
        const recentFilters = getResFilters(STATE_NAME)

        return {...defaultFilters, ...recentFilters}
    }
    else{
        throw new Error()
    }
}