import {useState, useEffect, useReducer, useCallback} from 'react'
import {ACTIONS, filterReducer, FILTER_ACTIONS, getFilters} from '../reducers/StoreReducer'
import {api, errorHandler, getQueryString, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'

function StorePage({store, dispatchStore, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit store */
    const [storeIndex, setStoreIndex] = useState('')
    const [storeId, setStoreId] = useState('')
    const [storeName, setStoreName] = useState('')
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Delete store */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter store */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())    
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       

    const getStores = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(store.stores !== null){
            setDisableBtn(true)
        }
        api.get(`/stores${getQueryString(queries)}`)
           .then(response => {
                if(store.stores !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                dispatchStore({type: actionType, payload: response.data})
                dispatchFilters({
                    type: FILTER_ACTIONS.RESET, payload: {
                        filters: response.data.filters
                    }
                })                
           })
           .catch(error => {
                if(store.stores !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [filters, store, dispatchStore])  

    const createStore = useCallback(() => {
        setStoreIndex('')
        setStoreId('')
        setStoreName('')
        setModalHeading('Create New Store')      
        setModalShown(true)
    }, [])

    const storeStore = useCallback(() => {
        setDisableBtn(true)
        api.post('/stores', {name: storeName})
            .then(response => {
                setDisableBtn(false)
                setModalShown(false)           
                dispatchStore({
                    type: ACTIONS.PREPEND, 
                    payload: {stores: response.data.store}
                })
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})           
            })           
    }, [storeName, dispatchStore])    

    const editStore = useCallback((index, id, name) => {
        setStoreIndex(index)
        setStoreId(id)
        setStoreName(name)
        setModalHeading(`Edit ${name}`)
        setModalShown(true)
    }, [])

    const updateStore = useCallback(() => {
        setDisableBtn(true)   
        api.put(`/stores/${storeId}`, {name: storeName})     
            .then(response => {
                dispatchStore({
                    type: ACTIONS.REPLACE, 
                    payload: {store: response.data.store, index: storeIndex}
                })                 
                setDisableBtn(false)   
                setSuccPopupMsg(response.data.message)   
                setModalShown(false)
                setSuccPopupShown(true)     
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })        
    }, [storeName, storeId, storeIndex, dispatchStore])  

    const confirmDeleteStore = useCallback((id, index) => {
        setStoreId(id)
        setStoreIndex(index)
        setPopupShown(true)
    }, [])

    const deleteStore = useCallback(() => {
        api.delete(`/stores/${storeId}`)     
            .then(response => {        
                dispatchStore({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: storeIndex}
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
    }, [storeId, storeIndex, dispatchStore])

    useEffect(() => {
        if(store.stores === null){
            getStores(ACTIONS.RESET)
        }
    }, [store, getStores])    
    // When the store resource is not set yet
    // Return loading UI
    if(store.stores === null){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={'+ Create'} size={'sm'} attr={{onClick: createStore}}/>
        </section>
        <PlainCard 
            body={<>
                <div className='flex-row items-center' style={{marginBottom: '2rem'}}>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: 'Search store', 
                            onChange: e => {dispatchFilters({
                                type: FILTER_ACTIONS.UPDATE, payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStores(ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button text={'Search'} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getStores(ACTIONS.RESET)}
                    }}/>                                       
                </div>            
                <StoresList 
                    stores={store.stores} 
                    editStore={editStore}
                    confirmDeleteStore={confirmDeleteStore}
                />
                <LoadMoreBtn 
                    canLoadMore={store.canLoadMore}
                    action={() => {getStores(ACTIONS.APPEND)}}
                />                  
                {
                    store.canLoadMore ? 
                    <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
                    onClick={() => {getStores(ACTIONS.APPEND)}}>
                        Load More
                    </button> : ''
                }                
            </>}
        />
        <Modal
            heading={modalHeading}
            size={'sm'}
            body={<>
                <TextInput size={'sm'} label={'Name'}
                    formAttr={{
                        value: storeName, onChange: (e) => {setStoreName(e.target.value)},
                        onKeyUp: (e) => {
                            keyHandler(e, 'Enter', storeIndex !== '' && storeId !== '' ? 
                                updateStore : storeStore                            
                            )
                        }
                    }}
                />      
            </>}        
            footer={
                <Button size={'sm'} text={'Save Changes'} attr={{
                        disabled: disableBtn,
                        onClick: () => {
                            storeIndex !== '' && storeId !== '' ? 
                            updateStore() : storeStore()
                        }
                    }}
                />                
            }
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />
        <Modal
            heading={'Filter'}
            size={'sm'}
            body={<>
                <Select label={'Rows shown'} 
                    formAttr={{
                        value: filters.limit,
                        onChange: e => {dispatchFilters({
                            type: FILTER_ACTIONS.UPDATE, payload: {key: 'limit', value: e.target.value}
                        })}                            
                    }}
                    options={[
                        {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                    ]}
                />
            </>}        
            footer={
                <Button size={'sm'} text={'Search'} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStores(ACTIONS.RESET)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this store?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteStore}
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

const StoresList = ({stores, editStore, confirmDeleteStore}) => {
    return (<>
        <div className="inventories-container">
            {stores.map((store, key) => (
                <div className="inventory flex-row items-center content-space-between" key={key}>
                    <span className="name">{store.name}</span>          
                    <span className="actions">
                        <Button 
                            size={'sm'} type={'light'} text={'View'}
                            attr={{onClick: () => {
                                    editStore(key, store.id, store.name, store.sizes)
                                }
                            }}
                        />
                        <Button 
                            size={'sm'} type={'light'} text={'Delete'} color={'red'}
                            attr={{onClick: () => {
                                    confirmDeleteStore(store.id, key)
                                }
                            }}                            
                        />                        
                    </span>             
                </div>
            ))}
        </div>    
    </>)
}

const LoadMoreBtn = ({canLoadMore, action}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
        onClick={action}>
            Load More
        </button> : ''        
    )
}

export default StorePage