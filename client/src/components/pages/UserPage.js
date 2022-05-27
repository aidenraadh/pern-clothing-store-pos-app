import {useState, useEffect, useCallback, useMemo, useReducer} from 'react'
import {
    ACTIONS as ADMIN_ACTIONS, 
    filterReducer as adminFilterReducer, 
    getFilters as getAdminFilters
} from '../reducers/AdminReducer'
import {
    ACTIONS as EMPLOYEE_ACTIONS, 
    filterReducer as employeeFilterReducer, 
    getFilters as getEmployeeFilters    
} from '../reducers/EmployeeReducer'
import {api, errorHandler, getQueryString, keyHandler} from '../Utils.js'
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
    /* Admin */
    const admin = props.admin
    const dispatchAdmin = props.dispatchAdmin
    /* Filter admin */
    const [adminFilters, dispatchAdminFilters] = useReducer(adminFilterReducer, getAdminFilters(
        props.admin.isLoaded
    ))
    /* Employee */
    const employee = props.employee
    const dispatchEmployee = props.dispatchEmployee
    /* Filter employee */
    const [employeeFilters, dispatchEmployeeFilters] = useReducer(employeeFilterReducer, getEmployeeFilters(
        props.employee.isLoaded
    ))     
    /* Create, update, delete user */
    const [userIndex, setUserIndex] = useState('')
    const [storeId, setStoreId] = useState('')
    const [userRoleId, setUserRoleId] = useState('')
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
    const [popupSuccCallback, setPopupSuccCallback] = useState(() => {})         
    
    const getAdmins = useCallback((actionType) => {
        // Get the queries
        const queries = {...adminFilters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ADMIN_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(admin.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(admin.isLoaded){
                    setDisableBtn(false)
                }
                dispatchAdmin({type: actionType, payload: {
                    admins: response.data.users,
                    filters: response.data.filters,
                }})
                dispatchAdminFilters({type: ADMIN_ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})
           })
           .catch(error => {
                if(admin.isLoaded){
                    setDisableBtn(false)
                }   
                errorHandler(error) 
           })
    }, [admin, adminFilters ,dispatchAdmin]) 

    const getEmployees = useCallback(actionType => {
        // Get the queries
        const queries = {...employeeFilters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === EMPLOYEE_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(employee.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                if(employee.isLoaded){
                    setDisableBtn(false)
                    // setEmployeefilterModalShown(false)
                }
                dispatchEmployee({type: actionType, payload: {
                    employees: response.data.users,
                    filters: response.data.filters,
                }})
                dispatchEmployeeFilters({type: EMPLOYEE_ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})
           })
           .catch(error => {
                if(employee.isLoaded){
                    setDisableBtn(false)
                    // setEmployeefilterModalShown(false)
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

    const createUser = useCallback(targetRoleId => {
        let heading = ''
        let defaultStoreId = ''

        switch(targetRoleId){
            case 2: // Admin
                heading = 'Create New Admin'
                targetRoleId = 2
                break;
            case 3: // Employee
                heading = 'Create New Employee'
                defaultStoreId = stores === null ? '' : stores[0].id
                targetRoleId = 3
                break;   
            default: heading = '';             
        }
        setName('')
        setEmail('')
        setRoleId(targetRoleId)
        setUserRoleId(targetRoleId)
        setStoreId(defaultStoreId)
        setCrtModalHeading(heading)
        setCrtModalShown(true)
    }, [stores])

    const storeUser = useCallback(() => {
        const data = {
            name: name, email: email, roleId: roleId, storeId: storeId
        }
        let dispatchFunction = null
        let reducerAction = ''
        let userArrayKey = ''

        switch(userRoleId){
            case 2: // Admin
                reducerAction = ADMIN_ACTIONS.PREPEND;
                dispatchFunction = dispatchAdmin
                userArrayKey = 'admins'
                break;
            case 3: // Employee
                reducerAction = EMPLOYEE_ACTIONS.PREPEND;
                dispatchFunction = dispatchEmployee   
                userArrayKey = 'employees'             
                break;    
            default: throw new Error();    
        }
        setDisableBtn(true)
        api.post('/users', data)
            .then(response => {        
                dispatchFunction({
                    type: reducerAction, 
                    payload: {[userArrayKey]: response.data.user}
                })
                setDisableBtn(false)
                setCrtModalShown(false)                   
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})           
            })  
    }, [roleId, userRoleId, name, email, storeId, dispatchAdmin, dispatchEmployee])

    const editUser = useCallback((targetRoleId, index) => {
        let user = null
        let heading = ''
        let storeId = ''

        switch(targetRoleId){
            case 3: // Employee
                user = employee.employees[index]
                storeId = user.storeEmployee.store.id
                heading = 'Edit Employee'
                break;   
            default: throw new Error();             
        }
        setUserIndex(index)
        setRoleId(targetRoleId)
        setUserRoleId(targetRoleId)
        setStoreId(storeId)
        setUpdModalHeading(heading)
        setUpdModalShown(true)
    }, [employee])

    const updateUser = useCallback(() => {
        let userId = ''
     
        switch(userRoleId){
            case 3: // Employee
                userId = (
                    employee.employees[userIndex] ? employee.employees[userIndex].id : ''
                );
                break;
            default: userId = '';
        }

        setDisableBtn(true)
        api.put(`/users/${userId}`, {
            roleId: roleId,
            storeId: storeId,
        })
        .then(response => {
            setDisableBtn(false)
            setSuccPopupMsg(response.data.message) 
            setUpdModalShown(false)
            setPopupSuccCallback(() => {window.location.reload()})
            setSuccPopupShown(true)      
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})           
        })         
    }, [userIndex, userRoleId, roleId, storeId, employee])  

    const confirmDeleteUser = useCallback((targetRoleId, index) => {
        setUserRoleId(targetRoleId)
        setUserIndex(index)
        setDltPopupShown(true)
    }, [])

    const deleteUser = useCallback(() => {
        let dispatchFunction = null
        let reducerAction = ''
        let userId = ''
        
        switch(userRoleId){
            case 3: // Employee
                userId = employee.employees[userIndex].id;
                dispatchFunction = dispatchEmployee;
                reducerAction = EMPLOYEE_ACTIONS.REMOVE;
                break;
            default: throw new Error();
        }        
        api.delete(`/users/${userId}`)     
            .then(response => {        
                dispatchFunction({
                    type: reducerAction, 
                    payload: {indexes: userIndex}
                })                
                setSuccPopupMsg(response.data.message) 
                setPopupSuccCallback(() => {})
                setSuccPopupShown(true) 
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })          
    }, [employee, userIndex, userRoleId, dispatchEmployee])    
    
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
        switch(userRoleId){
            case 3: // Employee
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
    }, [name, userRoleId, stores, storeId, email, storeUser])    

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
        ]        
        if(parseInt(roleId) === 3){
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
        }
        return <Grid numOfColumns={1} items={body}/>
    }, [roles, roleId, stores, storeId])    

    // Get admins if its not set yet
    useEffect(() => {
        if(admin.admins === null){ getAdmins(ADMIN_ACTIONS.RESET) }      
    }, [admin, getAdmins])    

    // Get employees if its not set yet
    useEffect(() => {
        if(employee.isLoaded === false){ getEmployees(EMPLOYEE_ACTIONS.RESET) }           
    }, [employee, getEmployees])       

    // Get stores if its not set yet
    useEffect(() => {
        if(stores === null){ getEmployeeStores() }        
    }, [stores, getEmployeeStores])       

    // Get roles if its not set yet
    useEffect(() => {
        if(roles === null){ getUserRoles() }          
    }, [roles, getUserRoles])        

    if(admin.admins === null || employee.isLoaded === false || stores === null){
        return 'Loading...'
    }

    return (<>
    <TabbedCard 
        tabs={[ 
            {link: 'Admin', panelID: 'admin', panelContent:
                <UsersTable appProps={props} roleId={2} 
                    getUsers={getAdmins} toggleCrtUser={createUser}
                />
            },
            {link: 'Employee', panelID: 'employee', panelContent:
                <UsersTable appProps={props} roleId={3} 
                    getUsers={getEmployees} toggleCrtUser={createUser} 
                    toggleEdtUser={editUser} toggleDltUser={confirmDeleteUser}
                />
            },										
        ]}
        currentPanelID={'admin'}    
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
        confirmCallback={popupSuccCallback}
    />     
    </>)
}

const UsersTable = ({appProps, roleId, getUsers, disableBtn, toggleCrtUser, toggleEdtUser, toggleDltUser}) => {
    let addBtnText = ''
    let tableHeadings = ['Name']
    let tableBody = []
    let loadMoreBtnVis
    let loadMoreBtnAction

    switch(roleId){
        case 2: // Admin
            addBtnText = '+ Add admin'
            tableBody = appProps.admin.admins.map(admin => ([admin.name]));
            loadMoreBtnVis = appProps.admin.canLoadMore
            loadMoreBtnAction = () => {getUsers(ADMIN_ACTIONS.APPEND)}
            break;
        case 3: // Employee
            addBtnText = '+ Add employee'
            tableHeadings.push('Store', 'Actions')
            tableBody = appProps.employee.employees.map((employee, index) => ([
                <span className='text-capitalize'>{employee.name}</span>, 
                <span className='text-capitalize'>{employee.storeEmployee.store.name}</span>,

                <div className='flex-row items-center'>
                    <Button size={'sm'} text={'Edit'} attr={{
                        onClick: () => {toggleEdtUser(roleId, index)},
                        style: {marginRight: '1rem'}
                    }}/>
                    <Button size={'sm'} color={'red'} text={'Remove'} attr={{
                        onClick: () => {toggleDltUser(roleId, index)}
                    }}/>                                    
                </div>
            ]));
            loadMoreBtnVis = appProps.employee.canLoadMore
            loadMoreBtnAction = () => {getUsers(EMPLOYEE_ACTIONS.APPEND)}            
            break; 
        default: throw new Error();           
    }
    return (
        <Grid numOfColumns={1} items={[
            <section className='flex-row content-end'>
                <Button size={'sm'} text={addBtnText} attr={{
                    onClick: () => {toggleCrtUser(roleId)}
                }}/>
            </section>,
            <Table
                headings={tableHeadings}
                body={tableBody}
            />,
            <LoadMoreBtn
                disableBtn={disableBtn}
                canLoadMore={loadMoreBtnVis}
                action={loadMoreBtnAction}
            />               
        ]}/>
    )
}

const LoadMoreBtn = ({canLoadMore, action, disableBtn}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
        onClick={action} disabled={disableBtn}>
            Load More
        </button> : ''        
    )
}

export default UserPage