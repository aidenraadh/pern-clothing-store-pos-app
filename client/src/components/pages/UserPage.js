import {useState, useEffect} from 'react'
import {OWNER_ACTIONS, OWNER_FILTER_KEY} from '../reducers/OwnerReducer'
import {EMPLOYEE_ACTIONS, EMPLOYEE_FILTER_KEY} from '../reducers/EmployeeReducer'
import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'

import {TabbedCard} from '../Cards'


function UserPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    /* Filter owner */
    const initOwnerFilters = getResFilters(OWNER_FILTER_KEY)
    const [ownerFilters, setOwnerFilters] = useState({
        limit: initOwnerFilters.limit ? initOwnerFilters.limit : 10, 
        offset: initOwnerFilters.offset ? initOwnerFilters.offset : 0, 
    })
    const [ownerFilterModalShown, setOwnerFilterModalShown] = useState(false)
    /* Filter employee */
    const initEmployeeFilters = getResFilters(EMPLOYEE_FILTER_KEY)
    const [employeeFilters, setEmployeeFilters] = useState({
        limit: initEmployeeFilters.limit ? initEmployeeFilters.limit : 10, 
        offset: initEmployeeFilters.offset ? initEmployeeFilters.offset : 0, 
    })
    const [employeeFilterModalShown, setEmployeefilterModalShown] = useState(false)    

    useEffect(() => {
        if(props.owner.owners === null){
            getOwners()
        }
        if(props.employee.employees === null){
            getEmployees()
        }   
        if(stores === null){
            getEmployeeStores()
        }                
    }, [])

    const getOwners = (actionType = '') => {
        // Get the queries
        const queries = {...ownerFilters, role: 'owner'}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === '' ? 0 : (queries.offset + queries.limit)

        if(props.owner.owners !== null){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(props.owner.owners !== null){
                    setDisableBtn(false)
                    setOwnerFilterModalShown(false)
                }
                props.dispatchOwner({type: actionType, payload: {
                    owners: response.data.users,
                    filters: response.data.filters,
                }})
                setOwnerFilters(getResFilters(OWNER_FILTER_KEY))
           })
           .catch(error => {
                if(props.owner.owners !== null){
                    setDisableBtn(false)
                    setOwnerFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    } 

    const getEmployees = (actionType = '') => {
        // Get the queries
        const queries = {...employeeFilters, role: 'employee'}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === '' ? 0 : (queries.offset + queries.limit)

        if(props.employee.employees !== null){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(props.employee.employees !== null){
                    setDisableBtn(false)
                    setEmployeefilterModalShown(false)
                }
                props.dispatchEmployee({type: actionType, payload: {
                    employees: response.data.users,
                    filters: response.data.filters,
                }})
                setEmployeeFilters(getResFilters(OWNER_FILTER_KEY))
           })
           .catch(error => {
                if(props.employee.employees !== null){
                    setDisableBtn(false)
                    setEmployeefilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }     

    const getEmployeeStores = () => {
        api.get(`/users/employee-stores`)
           .then(response => {
               setStores(response.data)
           })
           .catch(error => {

                errorHandler(error) 
           })
    }      

    return (<>
    <TabbedCard
        tabs={[ 
            {link: 'Owner', panelID: 'owner', panelContent:
                'This is owner tab.'
            },
            {link: 'Employee', panelID: 'employee', panelContent:
                'This is employee tab.'
            },										
        ]}
        currentPanelID={'owner'}    
    />          
    </>)
}

export default UserPage