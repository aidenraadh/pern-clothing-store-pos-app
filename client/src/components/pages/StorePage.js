import {useState, useEffect, useReducer, useCallback} from 'react'
import {ACTIONS, filterReducer, getFilters} from '../reducers/StoreReducer'
import {api, errorHandler, getQueryString, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import {Grid} from '../Layouts'
import Table from '../Table'

function StorePage({store, dispatchStore, user, loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit store */
    const [storeIndex, setStoreIndex] = useState('')
    const [storeName, setStoreName] = useState('')
    const [storeTypeId, setStoreTypeId] = useState('')
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Filters */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters(store.isLoaded))    
    /* Delete store */
    const [popupShown, setPopupShown] = useState(false)  
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       

    const getStores = useCallback(actionType => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(store.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/stores${getQueryString(queries)}`)
           .then(response => {
                if(store.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                dispatchStore({type: actionType, payload: response.data})
                dispatchFilters({type: ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})             
           })
           .catch(error => {
                if(store.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [store, filters, dispatchStore])  

    const createStore = useCallback(() => {
        setStoreIndex('')
        setStoreTypeId(Object.keys(store.storeTypes)[0])
        setStoreName('')
        setModalHeading(loc.createNewStore)      
        setModalShown(true)
    }, [store.storeTypes, loc])

    const storeStore = useCallback(() => {
        setDisableBtn(true)
        api.post('/stores', {
            name: storeName, typeId: storeTypeId,
        })
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
    }, [storeName, dispatchStore, storeTypeId])    

    const editStore = useCallback(index => {
        // Get the store 
        const targetStore = store.stores[index]        
        setStoreIndex(index)
        setStoreName(targetStore ? targetStore.name : '')
        setStoreTypeId(targetStore ? targetStore.type_id : '')
        setModalHeading(`Edit ${targetStore ? targetStore.name : ''}`)
        setModalShown(true)
    }, [store.stores])

    const updateStore = useCallback(() => {
        // Get the store 
        const targetStore = store.stores[storeIndex]
        setDisableBtn(true)   
        api.put(`/stores/${targetStore.id}`, {
            name: storeName, typeId: storeTypeId,
        })     
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
    }, [storeName, storeIndex, storeTypeId, store.stores, dispatchStore])  

    const confirmDeleteStore = useCallback(index => {
        setStoreIndex(index)
        setPopupShown(true)
    }, [])

    const deleteStore = useCallback(() => {
        // Get the store 
        const targetStore = store.stores[storeIndex]        

        api.delete(`/stores/${targetStore.id}`)     
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
    }, [storeIndex, dispatchStore, store.stores])

    useEffect(() => {
        if(store.isLoaded === false){
            console.log('load store')
            getStores(ACTIONS.RESET)
        }
    }, [store, getStores])    

    // When the store resource is not set yet
    // Return loading UI
    if(store.isLoaded === false){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={`+ ${loc.createStore}`} size={'sm'} attr={{onClick: createStore}}/>
        </section>
        <PlainCard 
            body={<>
                <div className='flex-row items-center' style={{marginBottom: '2rem'}}>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: loc.searchStore, 
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStores(ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getStores(ACTIONS.RESET)}
                    }}/>                                       
                </div>            
                <StoresTable 
                    loc={loc}
                    stores={store.stores} 
                    storeTypes={store.storeTypes}
                    editStore={editStore}
                    confirmDeleteStore={confirmDeleteStore}
                />
                <LoadMoreBtn 
                    canLoadMore={store.canLoadMore}
                    action={() => {getStores(ACTIONS.APPEND)}}
                />                                 
            </>}
        />
        <Modal
            heading={modalHeading}
            size={'sm'}
            body={
                <Grid numOfColumns={1} items={[
                    <TextInput label={loc.name}
                        formAttr={{
                            value: storeName, onChange: (e) => {setStoreName(e.target.value)},
                            onKeyUp: (e) => {
                                keyHandler(e, 'Enter', storeIndex !== '' ? updateStore : storeStore                            
                                )
                            }
                        }}
                    />,
                    <Select label={loc.type}
                        options={Object.keys(store.storeTypes).map(id => ({
                            text: loc[store.storeTypes[id]],
                            value: id,
                        }))}
                        formAttr={{
                            value: storeTypeId, onChange: (e) => {setStoreTypeId(e.target.value)},
                        }}
                    />   
                ]}/>
            }        
            footer={
                <Button size={'sm'} text={loc.saveChanges} attr={{
                        disabled: disableBtn,
                        onClick: () => {
                            storeIndex !== '' ? updateStore() : storeStore()
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
                <Select label={loc.rowsShown} 
                    formAttr={{
                        value: filters.limit,
                        onChange: e => {dispatchFilters({
                            type: ACTIONS.FILTERS.UPDATE, payload: {key: 'limit', value: e.target.value}
                        })}                            
                    }}
                    options={[
                        {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                    ]}
                />
            </>}        
            footer={
                <Button size={'sm'} text={loc.search} attr={{
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
            body={loc.storeDeleteWarningMsg}
            confirmText={loc.remove}
            cancelText={loc.cancel}
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

const StoresTable = ({loc, stores, storeTypes, editStore, confirmDeleteStore}) => {
    return <Table
        headings={[loc.name, loc.type, 'Actions']}
        body={stores.map((store, key) => ([
            <span className='text-capitalize'>{store.name}</span>,
            <span className='text-capitalize'>{loc[storeTypes[store.type_id]]}</span>,
            <>
                <Button 
                    size={'sm'} type={'light'} text={loc.view}
                    attr={{
                        style: {marginRight: '1rem'},
                        onClick: () => {editStore(key)}
                    }}
                />
                <Button 
                    size={'sm'} type={'light'} text={loc.delete} color={'red'}
                    attr={{onClick: () => {confirmDeleteStore(key)}}}                            
                />             
            </>
        ]))}
    />
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