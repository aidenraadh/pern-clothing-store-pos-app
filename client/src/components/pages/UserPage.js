import {useState, useEffect, useCallback, useMemo} from 'react'
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
    /* Owner */
    const owner = props.owner
    const dispatchOwner = props.dispatchOwner
    /* Employee */
    const employee = props.employee
    const dispatchEmployee = props.dispatchEmployee
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
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       
    
    const getOwners = useCallback((actionType) => {
        // Get the queries
        const queries = {...ownerFilters, role: 'owner'}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === OWNER_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(owner.owners !== null){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(owner.owners !== null){
                    setDisableBtn(false)
                    setOwnerFilterModalShown(false)
                }
                dispatchOwner({type: actionType, payload: {
                    owners: response.data.users,
                    filters: response.data.filters,
                }})
                setOwnerFilters(getResFilters(OWNER_FILTER_KEY))
           })
           .catch(error => {
                if(owner.owners !== null){
                    setDisableBtn(false)
                    setOwnerFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [ownerFilters, owner, dispatchOwner]) 

    const getEmployees = useCallback((actionType) => {
        // Get the queries
        const queries = {...employeeFilters, role: 'employee'}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === EMPLOYEE_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(employee.employees !== null){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(employee.employees !== null){
                    setDisableBtn(false)
                    setEmployeefilterModalShown(false)
                }
                dispatchEmployee({type: actionType, payload: {
                    employees: response.data.users,
                    filters: response.data.filters,
                }})
                setEmployeeFilters(getResFilters(EMPLOYEE_FILTER_KEY))
           })
           .catch(error => {
                if(employee.employees !== null){
                    setDisableBtn(false)
                    setEmployeefilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [employeeFilters, employee, dispatchEmployee])

    const getEmployeeStores = useCallback(() => {
        api.get(`/users/employee-stores`)
           .then(response => {
               setStores(response.data.stores)
           })
           .catch(error => {
                errorHandler(error) 
           })
    }, [])
    
    const getUserRoles = useCallback(() => {
        api.get(`/users/user-roles`)
           .then(response => {
               setRoles(response.data.roles)
           })
           .catch(error => {
                errorHandler(error) 
           })
    }, [])

    const createUser = useCallback((role) => {
        let heading = ''

        switch(role){
            case 'owner':
                heading = 'Create New Owner'
                break;
            case 'employee':
                heading = 'Create New Employee'
                break;   
            default: heading = '';             
        }
        setTargetRole(role)
        setCrtModalHeading(heading)
        setCrtModalShown(true)
    }, [])

    const storeUser = useCallback(() => {
        const data = {role: targetRole, name: name, email: email}
        let dispatchFunction = null
        let reducerAction = ''

        switch(targetRole){
            case 'owner':
                reducerAction = OWNER_ACTIONS.PREPEND;
                dispatchFunction = dispatchOwner
                break;
            case 'employee':
                reducerAction = EMPLOYEE_ACTIONS.PREPEND;
                dispatchFunction = dispatchEmployee                
                data.store_id = storeId ? storeId : (
                    stores.length ? stores[0].id : ''
                );
                break;    
            default: reducerAction = '';    
        }
        setDisableBtn(true)
        api.post('/users', data)
            .then(response => {
                setDisableBtn(false)
                setCrtModalShown(false)           
                dispatchFunction({
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
    }, [targetRole, name, email, storeId, stores, dispatchOwner, dispatchEmployee])

    const editUser = useCallback((role, index) => {
        let user = null
        let heading = ''
        let storeId = ''
        let roleId = ''

        switch(role){
            case 'employee':
                user = employee.employees[index]
                storeId = user.storeEmployee.store_id
                roleId = user.role_id
                heading = 'Edit Employee'
                break;   
            default: heading = '';             
        }
        setUserIndex(index)
        setTargetRole(role)
        setRoleId(roleId)
        setStoreId(storeId)
        setUpdModalHeading(heading)
        setUpdModalShown(true)
    }, [employee])

    const updateUser = useCallback(() => {
        let data = {role: targetRole}
        let userId = ''
        switch(targetRole){
            case 'employee':
                userId = employee.employees[userIndex].id;
                data.role_id = roleId;
                data.store_id = storeId;
                break;
            default: userId = '';
        }

        setDisableBtn(true)
        api.put(`/users/${userId}`, data)
            .then(response => {
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message) 
                setUpdModalShown(false)      
                setSuccPopupShown(true)      
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})           
            })         
    }, [targetRole, userIndex, roleId, storeId, employee])  

    const confirmDeleteUser = useCallback((role, index) => {
        setTargetRole(role)
        setUserIndex(index)
        setDltPopupShown(true)
    }, [])

    const deleteUser = useCallback(() => {
        let dispatchFunction = null
        let reducerAction = ''
        let userId = ''
        
        switch(targetRole){
            case 'employee':
                userId = employee.employees[userIndex].id;
                dispatchFunction = dispatchEmployee;
                reducerAction = EMPLOYEE_ACTIONS.REMOVE;
                break;
            default: userId = '';
        }        
        api.delete(`/users/${userId}`)     
            .then(response => {        
                dispatchFunction({
                    type: reducerAction, 
                    payload: {indexes: userIndex}
                })                
                setSuccPopupMsg(response.data.message) 
                setSuccPopupShown(true) 
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })          
    }, [employee, userIndex, targetRole, dispatchEmployee])    
    
    const CreateUserForms = useMemo(() => {
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
                        options={stores === null ? [] : stores.map(store => ({
                            value: store.id, text: store.name,
                        }))}
                        formAttr={{
                            value: storeId,
                            onChange: (e) => {setStoreId(e.target.value)}
                        }}                       
                    />
                )
                break;  
            default: body.push()              
        }
        return <Grid numOfColumns={1} items={body}/>
    }, [name, targetRole, stores, storeId, email, storeUser])    

    const UpdateUserForms = useMemo(() => {
        const body = [
            <Select size={'md'} label={'Role'}
                options={roles === null ? [] : roles.map(role => ({
                    value: role.id, text: role.name,
                }))}
                formAttr={{
                    value: roleId,
                    onChange: (e) => {setRoleId(e.target.value)}
                }}                       
            />,
            <Select size={'md'} label={'Store'}
                options={stores === null ? [] : stores.map(store => ({
                    value: store.id, text: store.name,
                }))}
                formAttr={{
                    value: storeId,
                    onChange: (e) => {setStoreId(e.target.value)}
                }}                       
            />               
        ]        
        return <Grid numOfColumns={1} items={body}/>
    }, [roles, roleId, stores, storeId, targetRole])    

    // Get owners if its not set yet
    useEffect(() => {
        if(owner.owners === null){ getOwners(OWNER_ACTIONS.RESET) }      
    }, [owner, getOwners])    

    // Get employees if its not set yet
    useEffect(() => {
        if(employee.employees === null){ getEmployees(EMPLOYEE_ACTIONS.RESET) }           
    }, [employee, getEmployees])       

    // Get stores if its not set yet
    useEffect(() => {
        if(stores === null){ getEmployeeStores() }        
    }, [stores, getEmployeeStores])       

    // Get roles if its not set yet
    useEffect(() => {
        if(roles === null){ getUserRoles() }          
    }, [roles, getUserRoles])        

    if(owner.owners === null || employee.employees === null){
        return 'Loading...'
    }

    return (<>
    <TabbedCard 
        tabs={[ 
            {link: 'Owner', panelID: 'owner', panelContent:
                <UsersTable appProps={props} role={'owner'} 
                    getUsers={getOwners} toggleCrtUser={createUser}
                />
            },
            {link: 'Employee', panelID: 'employee', panelContent:
                <UsersTable appProps={props} role={'employee'} 
                    getUsers={getEmployees} toggleCrtUser={createUser} 
                    toggleEdtUser={editUser} toggleDltUser={confirmDeleteUser}
                />
            },										
        ]}
        currentPanelID={'owner'}    
    />    
    <Modal
        heading={crtModalHeading}
        size={'sm'}
        body={CreateUserForms}
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
        size={'sm'}
        body={UpdateUserForms}
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
    <ConfirmPopup
        shown={succPopupShown}
        icon={'done_circle'}
        iconColor={'blue'}
        title={"Success"}
        body={popupSuccMsg}
        confirmText={'OK'}
        togglePopup={() => {setSuccPopupShown(state => !state)}} 
    />     
    </>)
}

const UsersTable = ({appProps, role, getUsers, toggleCrtUser, toggleEdtUser, toggleDltUser}) => {
    let addBtnText = ''
    let tableHeadings = ['Name']
    let tableBody = []
    let loadMoreBtnVis
    let loadMoreBtnAction

    switch(role){
        case 'owner':
            addBtnText = '+ Add owner'
            tableBody = appProps.owner.owners.map(owner => ([owner.name]));
            loadMoreBtnVis = appProps.owner.canLoadMore
            loadMoreBtnAction = () => {getUsers(OWNER_ACTIONS.APPEND)}
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
            loadMoreBtnVis = appProps.employee.canLoadMore
            loadMoreBtnAction = () => {getUsers(EMPLOYEE_ACTIONS.APPEND)}            
            break; 
        default: addBtnText = '';           
    }
    return (
        <Grid numOfColumns={1} items={[
            <section className='flex-row content-end'>
                <Button size={'sm'} text={addBtnText} attr={{
                    onClick: () => {toggleCrtUser(role)}
                }}/>
            </section>,
            <Table
                headings={tableHeadings}
                body={tableBody}
            />,
            <LoadMoreBtn 
                canLoadMore={loadMoreBtnVis}
                action={loadMoreBtnAction}
            />               
        ]}/>
    )
}

const LoadMoreBtn = ({canLoadMore, action}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
        onClick={action}>
            Load More
        </button> : ''        
    )
}

export default UserPage