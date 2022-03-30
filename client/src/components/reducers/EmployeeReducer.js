import { saveResFilters } from "../Utils";

export const EMPLOYEE_FILTER_KEY = 'employee'

export const EMPLOYEE_INIT_STATE = {
    employees: null, // Array of employees
    canLoadMore: true, // Whether or not the employees can be loaded more 
}
export const EMPLOYEE_ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
}

export const employeeReducer = (state, action) => {
    const {type, payload} = action
    saveResFilters(EMPLOYEE_FILTER_KEY, payload.filters);

    switch(type){
        // Append employee(s) to 'employees'
        case EMPLOYEE_ACTIONS.APPEND: 
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...state.employees, ...payload.employees] : 
                    [...state.employees, payload.employees]
                ),
                canLoadMore: payload.employees.length < payload.filters.limit ? false : true
            }; 
        // Prepend array of employee(s) to 'employees'
        case EMPLOYEE_ACTIONS.PREPEND: 
            return {
                ...state, employees: (
                    Array.isArray(payload.employees) ? 
                    [...payload.employees, ...state.employees] : 
                    [payload.employees, ...state.employees]                
                ),
            };
        // Replace employee inside 'employees'
        case EMPLOYEE_ACTIONS.REPLACE: 
            return {
                ...state, employees: (() => {
                    const employees = [...state.employees]
                    employees[payload.index] = payload.employee
                    return employees
                })()
            };            
        // Remove employee(s) from 'employees'
        case EMPLOYEE_ACTIONS.REMOVE: 
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
        default: return {
            ...state, employees: [...payload.employees],
            canLoadMore: payload.employees.length < payload.filters.limit ? false : true
        };
    }
}