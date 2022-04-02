import {useState, useEffect} from 'react'
import {OWNER_ACTIONS, OWNER_FILTER_KEY} from '../reducers/OwnerReducer'
import {EMPLOYEE_ACTIONS, EMPLOYEE_FILTER_KEY} from '../reducers/EmployeeReducer'
import {api, errorHandler, getResFilters, getQueryString, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {Grid} from '../Layouts'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'
import {TabbedCard} from '../Cards'

function UserPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    const [roles, setRoles] = useState(null)
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
    /* Create, update, delete user */
    const [targetRole, setTargetRole] = useState('')
    const [userIndex, setUserIndex] = useState('')
    const [storeId, setStoreId] = useState('')
    const [roleId, setRoleId] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [crtModalHeading, setCrtModalHeading] = useState('')
    const [crtModalShown, setCrtModalShown] = useState(false)
    const [updModalHeading, setUpdModalHeading] = useState('')
    const [updModalShown, setUpdModalShown] = useState(false)    
     const [dltPopupShown, setDltPopupShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')        


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
        if(roles === null){
            getUserRoles()
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
    
    const getUserRoles = () => {
        api.get(`/users/user-roles`)
           .then(response => {
               setRoles(response.data.roles)
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
        setTargetRole(role)
        setCrtModalHeading(heading)
        setCrtModalShown(true)
    }

    const GenerateCrtUserForms = () => {
        const body = [
            <TextInput label={'Name'} size={'md'} formAttr={{
                value: name,
                onChange: (e) => {setName(e.target.value)},
                onKeyUp: (e) => {keyHandler(e, 'Enter', storeUser)}
            }}/>,
            <TextInput label={'Email'} size={'md'} formAttr={{
                type: 'email', value: email, 
                onChange: (e) => {setEmail(e.target.value)},
                onKeyUp: (e) => {keyHandler(e, 'Enter', storeUser)}
            }}/>                
        ]        
        switch(targetRole){
            case 'employee':
                body.push(
                    <Select size={'md'} label={'Store'}
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
        const data = {role: targetRole, name: name, email: email}
        let dispatchFuncName = null
        let reducerAction = ''

        switch(targetRole){
            case 'owner':
                reducerAction = OWNER_ACTIONS.PREPEND;
                dispatchFuncName = 'dispatchOwner'
                break;
            case 'employee':
                reducerAction = EMPLOYEE_ACTIONS.PREPEND;
                dispatchFuncName = 'dispatchEmployee'                
                data.store_id = storeId ? storeId : (
                    stores.length ? stores[0].id : ''
                );
                break;        
        }
        setDisableBtn(true)
        api.post('/users', data)
            .then(response => {
                setDisableBtn(false)
                setCrtModalShown(false)           
                props[dispatchFuncName]({
                    type: reducerAction, 
                    payload: {[`${targetRole}s`]: response.data.user}
                })
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})           
            })  
    }    

    const editUser = (role, index) => {
        let user = null
        let heading = ''
        let storeId = ''
        let roleId = ''

        switch(role){
            case 'employee':
                user = props.employee.employees[index]
                storeId = user.storeEmployee.store_id
                roleId = user.role_id
                heading = 'Edit Employee'
                break;                
        }
        setUserIndex(index)
        setTargetRole(role)
        setRoleId(roleId)
        setStoreId(storeId)
        setUpdModalHeading(heading)
        setUpdModalShown(true)
    }    

    const GenerateUpdUserForms = () => {
        const body = [
            <Select size={'md'} label={'Role'}
                options={roles.map(role => ({
                    value: role.id, text: role.name,
                }))}
                formAttr={{
                    value: roleId,
                    onChange: (e) => {setRoleId(e.target.value)}
                }}                       
            />,
            <Select size={'md'} label={'Store'}
                options={stores.map(store => ({
                    value: store.id, text: store.name,
                }))}
                formAttr={{
                    value: storeId,
                    onChange: (e) => {setStoreId(e.target.value)}
                }}                       
            />               
        ]        
        switch(targetRole){
            case 'employee':
                break;                
        }
        return <Grid num_of_columns={1} items={body}/>
    }    

    const updateUser = () => {
        let data = {role: targetRole}
        let userId = ''
        switch(targetRole){
            case 'employee':
                userId = props.employee.employees[userIndex].id;
                data.role_id = roleId;
                data.store_id = storeId;
                break;
        }

        setDisableBtn(true)
        api.put(`/users/${userId}`, data)
            .then(response => {
                setDisableBtn(false)
                setUpdModalShown(false)           
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})           
            })         
    }
    const confirmDeleteUser = (role, index) => {
        setTargetRole(role)
        setUserIndex(index)
        setDltPopupShown(true)
    }   

    const deleteUser = () => {
        let dispatchFuncName = null
        let reducerAction = ''
        let userId = ''
        
        switch(targetRole){
            case 'employee':
                userId = props.employee.employees[userIndex].id;
                dispatchFuncName = 'dispatchEmployee';
                reducerAction = EMPLOYEE_ACTIONS.REMOVE;
                break;
        }        
        api.delete(`/users/${userId}`)     
            .then(response => {        
                props[dispatchFuncName]({
                    type: reducerAction, 
                    payload: {indexes: userIndex}
                })                
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })          
    }   
    if(
        props.owner.owners === null || props.employee.employees === null ||
        stores === null || roles === null
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
                    toggleCrtUser={createUser} toggleEdtUser={editUser}
                    toggleDltUser={confirmDeleteUser}
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
    <Modal
        heading={updModalHeading}
        body={GenerateUpdUserForms()}
        shown={updModalShown}
        footer={
            <Button text={'Save change'} size={'sm'} attr={{
                disabled: disableBtn,
                onClick: () => {updateUser()}
            }}/>
        }
        toggleModal={() => {setUpdModalShown(state => !state)}}
    />      
    <ConfirmPopup
        icon={'warning_1'}
        title={'Warning'}
        body={'Are you sure want to remove this user?'}
        confirmText={'Remove'}
        cancelText={'Cancel'}
        shown={dltPopupShown} togglePopup={() => {setDltPopupShown(state => !state)}} 
        confirmCallback={deleteUser}
    />    
    <ConfirmPopup
        shown={errPopupShown}
        icon={'error_circle'}
        iconColor={'red'}
        title={"Can't Proceed"}
        body={popupErrMsg}
        confirmText={'OK'}
        togglePopup={() => {setErrPopupShown(state => !state)}} 
    />      
    </>)
}

const GenerateUsers = ({appProps, role, toggleCrtUser, toggleEdtUser, toggleDltUser}) => {
    let addBtnText = ''
    let tableHeadings = ['Name']
    let tableBody = []

    switch(role){
        case 'owner':
            addBtnText = '+ Add owner'
            tableBody = appProps.owner.owners.map(owner => ([owner.name]));
            break;
        case 'employee':
            addBtnText = '+ Add employee'
            tableHeadings.push('Store', 'Actions')
            tableBody = appProps.employee.employees.map((employee, index) => ([
                employee.name, employee.storeEmployee.store.name,
                <div className='flex-row items-center'>
                    <Button size={'sm'} text={'Edit'} attr={{
                        onClick: () => {toggleEdtUser(role, index)},
                        style: {marginRight: '1rem'}
                    }}/>
                    <Button size={'sm'} color={'red'} text={'Remove'} attr={{
                        onClick: () => {toggleDltUser('employee', index)}
                    }}/>                                    
                </div>
            ]));
            break;            
    }
    return (
        <Grid num_of_columns={1} items={[
            <section className='flex-row content-end'>
                <Button size={'sm'} text={addBtnText} attr={{
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