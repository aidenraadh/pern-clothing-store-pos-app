import {useState, useEffect, useReducer, useCallback} from 'react'
import {STORE_ACTIONS, STORE_FILTER_KEY} from '../reducers/StoreReducer'
import {api, errorHandler, getResFilters, getQueryString, keyHandler} from '../Utils.js'
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
    const [filters, dispatchFilters] = useReducer(filterReducer, (() => {
        const initState = getResFilters(STORE_FILTER_KEY)
        return {
            name: initState.name ? initState.name : '',
            limit: initState.limit ? initState.limit : 10, 
            offset: initState.offset ? initState.offset : 0,             
        }
    })())    
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    

    const getStores = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === STORE_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

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
                    type: 'reset', payload: getResFilters(STORE_FILTER_KEY)
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
                    type: STORE_ACTIONS.PREPEND, 
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
                setDisableBtn(false)
                setModalShown(false)            
                dispatchStore({
                    type: STORE_ACTIONS.REPLACE, 
                    payload: {store: response.data.store, index: storeIndex}
                })                
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
                    type: STORE_ACTIONS.REMOVE, 
                    payload: {indexes: storeIndex}
                })                
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
            getStores(STORE_ACTIONS.RESET)
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
                    <TextInput size={'md'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: 'Search store', 
                            onChange: e => {dispatchFilters({
                                type: 'update', payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStores(STORE_ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getStores(STORE_ACTIONS.RESET)}
                    }}/>                                       
                </div>            
                <StoresList 
                    stores={store.stores} 
                    editStore={editStore}
                    confirmDeleteStore={confirmDeleteStore}
                />
                <LoadMoreBtn 
                    canLoadMore={store.canLoadMore}
                    action={() => {getStores(STORE_ACTIONS.APPEND)}}
                />                  
                {
                    store.canLoadMore ? 
                    <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
                    onClick={() => {getStores(STORE_ACTIONS.APPEND)}}>
                        Load More
                    </button> : ''
                }                
            </>}
        />
        <Modal
            heading={modalHeading}
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
            body={<>
                <Select label={'Rows shown'} 
                    formAttr={{
                        value: filters.limit,
                        onChange: e => {dispatchFilters({
                            type: 'update', payload: {key: 'limit', value: e.target.value}
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
                        onClick: () => {getStores(STORE_ACTIONS.RESET)}
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
    </>)
}

const filterReducer = (state, action) => {
    const payload = action.payload
    switch(action.type){
        case 'update': 
            if(payload.key === 'limit'){ payload.value = parseInt(payload.value) }
            return {...state, [payload.key]: payload.value}

        case 'reset': return payload

        default: throw new Error();
    }
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