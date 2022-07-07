import {useState, useEffect, useCallback, useMemo} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {
    append as appendAdmins, prepend as prependAdmins,
    syncFilters as syncAdminFilters, reset as resetAdmins
} from '../../features/adminSlice'
import {
    append as appendEmployees, prepend as prependEmployees,
    remove as removeEmployees, syncFilters as syncEmployeeFilters, reset as resetEmployees
} from '../../features/employeeSlice'
import {api, errorHandler, getQueryString, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {Grid} from '../Layouts'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'
import {TabbedCard} from '../Cards'

function UserPage({user, setPageHeading, loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    const admin = useSelector(state => state.admin)
    const employee = useSelector(state => state.employee)
    const dispatch = useDispatch()      
    const [stores, setStores] = useState(null)
    const [roles, setRoles] = useState(null)    
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
    
    const getAdmins = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === resetAdmins){
            queries = {...admin.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === appendAdmins){
            queries = {...admin.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                const responseData = response.data
                dispatch(actionType({
                    admins: responseData.users,
                    filters: responseData.filters,
                }))
                setDisableBtn(false)
           })
           .catch(error => {
                setDisableBtn(false)      
                errorHandler(error) 
           })
    }, [admin, dispatch]) 

    const getEmployees = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === resetEmployees){
            queries = {...employee.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === appendEmployees){
            queries = {...employee.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/users${getQueryString(queries)}`)
           .then(response => {
                const responseData = response.data
                setDisableBtn(false)
                dispatch(actionType({
                    employees: responseData.users,
                    filters: responseData.filters
                }))                 
           })
           .catch(error => {
                setDisableBtn(false) 
                errorHandler(error) 
           })
    }, [employee, dispatch])

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
                heading = loc.createNewAdmin
                targetRoleId = 2
                break;
            case 3: // Employee
                heading = loc.createNewEmployee
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
    }, [stores, loc])

    const storeUser = useCallback(() => {
        const data = {
            name: name, email: email, roleId: roleId, storeId: storeId
        }
        let reducerAction = ''
        let userArrayKey = ''

        switch(userRoleId){
            case 2: // Admin
                reducerAction = prependAdmins;
                userArrayKey = 'admins'
                break;
            case 3: // Employee
                reducerAction = prependEmployees;
                userArrayKey = 'employees'             
                break;    
            default: throw new Error();    
        }
        setDisableBtn(true)
        api.post('/users', data)
            .then(response => {        
                dispatch(reducerAction({
                    [userArrayKey]: response.data.user
                }))
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
    }, [roleId, userRoleId, name, email, storeId, dispatch])

    const editUser = useCallback((targetRoleId, index) => {
        let user = null
        let heading = ''
        let storeId = ''

        switch(targetRoleId){
            case 3: // Employee
                user = employee.employees[index]
                storeId = user.storeEmployee.store.id
                heading = loc.editEmployee
                break;   
            default: throw new Error();             
        }
        setUserIndex(index)
        setRoleId(targetRoleId)
        setUserRoleId(targetRoleId)
        setStoreId(storeId)
        setUpdModalHeading(heading)
        setUpdModalShown(true)
    }, [employee, loc])

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
        let reducerAction = ''
        let userId = ''
        
        switch(userRoleId){
            case 3: // Employee
                userId = employee.employees[userIndex].id;
                reducerAction = removeEmployees;
                break;
            default: throw new Error();
        }        
        api.delete(`/users/${userId}`)     
            .then(response => {        
                dispatch(reducerAction({
                    indexes: userIndex
                }))               
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
    }, [employee, userIndex, userRoleId, dispatch])    
    
    const CreateUserForms = useMemo(() => {
        const body = [
            <TextInput label={loc.name} size={'md'} formAttr={{
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
                    <Select size={'md'} label={loc.store}
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
    }, [name, userRoleId, stores, storeId, email, storeUser, loc])    

    const UpdateUserForms = useMemo(() => {
        const body = [
            <Select size={'md'} label={loc.role}
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
                <Select size={'md'} label={loc.store}
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
    }, [roles, roleId, stores, storeId, loc])    

    // Get admins if its not set yet
    useEffect(() => {
        if(admin.isLoaded === false){ getAdmins(resetAdmins) }      
    }, [admin, getAdmins])    

    // Get employees if its not set yet
    useEffect(() => {
        if(employee.isLoaded === false){ getEmployees(resetEmployees) }           
    }, [employee, getEmployees])       

    // Get stores if its not set yet
    useEffect(() => {
        if(stores === null){ getEmployeeStores() }        
    }, [stores, getEmployeeStores])       

    // Get roles if its not set yet
    useEffect(() => {
        if(roles === null){ getUserRoles() }          
    }, [roles, getUserRoles])        

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncAdminFilters())
            dispatch(syncEmployeeFilters())
        }
    }, [dispatch])     
    
    useEffect(() => {
        setPageHeading({title: 'Users', icon: 'group'})
    }, [])

    if(admin.isLoaded === false || employee.isLoaded === false || stores === null){
        return 'Loading...'
    }

    return (<>
    <TabbedCard 
        tabs={[ 
            {link: loc.admin, panelID: 'admin', panelContent:
                <UsersTable userState={admin} disableBtn={disableBtn} loc={loc}
                    getUsers={() => {getAdmins(appendAdmins)}} toggleCrtUser={createUser}
                />
            },
            {link: loc.employee, panelID: 'employee', panelContent:
                <UsersTable userState={employee} disableBtn={disableBtn} loc={loc}
                    getUsers={() => {getEmployees(appendEmployees)}} toggleCrtUser={createUser} 
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
            <Button text={loc.saveChanges} size={'sm'} attr={{
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
            <Button text={loc.saveChanges} size={'sm'} attr={{
                disabled: disableBtn,
                onClick: () => {updateUser()}
            }}/>
        }
        toggleModal={() => {setUpdModalShown(state => !state)}}
    />      
    <ConfirmPopup
        icon={'warning_1'}
        title={'Warning'}
        body={loc.removeUserMsg}
        confirmText={loc.remove}
        cancelText={loc.cancel}
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

const UsersTable = ({userState, disableBtn, loc, getUsers, toggleCrtUser, toggleEdtUser, toggleDltUser}) => {
    const roleId = userState.lastFilters.role_id
    const canLoadMore = userState.canLoadMore
    let addBtnText = ''
    let tableHeadings = ['No.', loc.name]
    let tableBody = []

    switch(roleId){
        case 2: // Admin
            addBtnText = loc.addAdmin
            tableBody = userState.admins.map((admin, index) => ([(index + 1), admin.name]));
            break;
        case 3: // Employee
            addBtnText = loc.addEmployee
            tableHeadings.push(loc.store, 'Actions')
            tableBody = userState.employees.map((employee, index) => ([
                (index + 1), 
                <span className='text-capitalize'>{employee.name}</span>, 
                <span className='text-capitalize'>{employee.storeEmployee.store.name}</span>,

                <div className='flex-row items-center'>
                    <Button size={'sm'} text={loc.edit} attr={{
                        onClick: () => {toggleEdtUser(roleId, index)},
                        style: {marginRight: '1rem'}
                    }}/>
                    <Button size={'sm'} color={'red'} text={loc.remove} attr={{
                        onClick: () => {toggleDltUser(roleId, index)}
                    }}/>                                    
                </div>
            ]));
            break; 
        default: throw new Error();           
    }
    return (<>
        <section className='flex-row content-end'>
            <Button size={'sm'} text={addBtnText} attr={{
                onClick: () => {toggleCrtUser(roleId)}
            }}/>
        </section>
        <Table
            headings={tableHeadings}
            body={tableBody}
        />
        <LoadMoreBtn
            disableBtn={disableBtn}
            canLoadMore={canLoadMore}
            action={getUsers}
        />      
    </>)
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