import {useState, useEffect} from 'react'
import {OWNER_ACTIONS, OWNER_FILTER_KEY} from '../reducers/OwnerReducer'
import {EMPLOYEE_ACTIONS, EMPLOYEE_FILTER_KEY} from '../reducers/EmployeeReducer'
import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {Grid} from '../Layouts'
import {Modal} from '../Windows'
import Table from '../Table'
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
    /* Create user */
    const [userRole, setUserRole] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [storeId, setStoreId] = useState('')
    const [crtModalHeading, setCrtModalHeading] = useState('')
    const [crtModalShown, setCrtModalShown] = useState(false)


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
               setStores(response.data.stores)
           })
           .catch(error => {

                errorHandler(error) 
           })
    }       

    const createUser = (role) => {
        let heading = ''

        switch(role){
            case 'owner':
                heading = 'Create New Owner'
                break;
            case 'employee':
                heading = 'Create New Employee'
                break;                
        }
        setUserRole(role)
        setCrtModalHeading(heading)
        setCrtModalShown(true)
    }

    const GenerateCrtUserForms = () => {
        const body = [
            <TextInput label={'Name'} size={'sm'} formAttr={{
                value: name,
                onChange: (e) => {setName(e.target.value)}
            }}/>,
            <TextInput label={'Email'} size={'sm'} formAttr={{
                type: 'email', value: email, 
                onChange: (e) => {setEmail(e.target.value)}
            }}/>                
        ]        
        switch(userRole){
            case 'employee':
                body.push(
                    <Select size={'sm'} label={'Store'}
                        options={stores.map(store => ({
                            value: store.id, text: store.name,
                        }))}
                        formAttr={{
                            value: storeId,
                            onChange: (e) => {setStoreId(e.target.value)}
                        }}                       
                    />
                )
                break;                
        }
        return <Grid num_of_columns={1} items={body}/>
    }

    const storeUser = () => {
        const data = {name: name, email: email}
        switch(userRole){
            case 'owner':
                break;
            case 'employee':
                data.store_id = storeId ? storeId : (
                    stores.length ? stores[0].id : ''
                )
                break;        
        }
        console.log(data)
    }
   
    if(
        props.owner.owners === null || props.employee.employees === null ||
        stores === null
    ){
        return 'Loading...'
    }

    return (<>
    <TabbedCard
        tabs={[ 
            {link: 'Owner', panelID: 'owner', panelContent:
                <GenerateUsers appProps={props} role={'owner'} 
                    toggleCrtUser={createUser}
                />
            },
            {link: 'Employee', panelID: 'employee', panelContent:
                <GenerateUsers appProps={props} role={'employee'} 
                    toggleCrtUser={createUser}
                />
            },										
        ]}
        currentPanelID={'owner'}    
    />    
    <Modal
        heading={crtModalHeading}
        body={GenerateCrtUserForms()}
        shown={crtModalShown}
        footer={
            <Button text={'Save change'} size={'sm'} attr={{
                disabled: disableBtn,
                onClick: () => {storeUser()}
            }}/>
        }
        toggleModal={() => {setCrtModalShown(state => !state)}}
    />      
    </>)
}

const GenerateUsers = ({appProps, role, toggleCrtUser}) => {
    let tableHeadings = ['Name']
    let tableBody = []

    switch(role){
        case 'owner':
            tableBody = appProps.owner.owners.map(owner => ([owner.name]));
            break;
        case 'employee':
            tableHeadings.push('Store', 'Actions')
            tableBody = appProps.employee.employees.map(employee => ([
                employee.name, employee.storeEmployee.store.name,
                <div className='flex-row items-center'>
                    <Button size={'sm'} text={'Edit'} attr={{style: {marginRight: '1rem'}}}/>,
                    <Button size={'sm'} color={'red'} text={'Remove'} />                                    
                </div>
            ]));
            break;            
    }
    return (
        <Grid num_of_columns={1} items={[
            <section className='flex-row content-end'>
                <Button size={'sm'} text={'+ Add'} attr={{
                    onClick: () => {toggleCrtUser(role)}
                }}/>
            </section>,
            <Table
                headings={tableHeadings}
                body={tableBody}
            />        
        ]}/>
    )
}

export default UserPage