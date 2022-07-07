import {useState, useEffect, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/storeSlice'
import {api, errorHandler, getQueryString, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import {Grid} from '../Layouts'
import Table from '../Table'

function StorePage({user, setPageHeading, loc}){
    const store = useSelector(state => state.store)
    const dispatch = useDispatch()        
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit store */
    const [storeIndex, setStoreIndex] = useState('')
    const [storeName, setStoreName] = useState('')
    const [storeTypeId, setStoreTypeId] = useState('')
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Filters */
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Delete store */
    const [popupShown, setPopupShown] = useState(false)  
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       

    const getStores = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...store.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...store.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/stores${getQueryString(queries)}`)
           .then(response => {
                const responseData = response.data
                setDisableBtn(false)
                setFilterModalShown(false)                  
                dispatch(actionType({
                    stores: responseData.stores,
                    storeTypes: responseData.storeTypes,
                    filters: responseData.filters
                }))                            
           })
           .catch(error => {
                setDisableBtn(false)
                setFilterModalShown(false)                 
                errorHandler(error) 
           })
    }, [store, dispatch])  

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
            dispatch(prepend({ stores: response.data.store }))
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})           
        })           
    }, [storeName, dispatch, storeTypeId])    

    const editStore = useCallback(index => {
        // Get the store 
        const targetStore = store.stores[index]        
        setStoreIndex(index)
        setStoreName(targetStore ? targetStore.name : '')
        setStoreTypeId(targetStore ? targetStore.type_id : '')
        setModalHeading(`Edit ${targetStore ? targetStore.name : ''}`)
        setModalShown(true)
    }, [store])

    const updateStore = useCallback(() => {
        // Get the store 
        const targetStore = store.stores[storeIndex]
        setDisableBtn(true)   
        api.put(`/stores/${targetStore.id}`, {
            name: storeName, typeId: storeTypeId,
        })     
            .then(response => {   
                setDisableBtn(false)   
                setSuccPopupMsg(response.data.message)   
                setModalShown(false)
                setSuccPopupShown(true)     
                dispatch(replace({ store: response.data.store, index: storeIndex }))            
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })        
    }, [storeName, storeIndex, storeTypeId, store, dispatch])  

    const confirmDeleteStore = useCallback(index => {
        setStoreIndex(index)
        setPopupShown(true)
    }, [])

    const deleteStore = useCallback(() => {
        // Get the store 
        const targetStore = store.stores[storeIndex]        

        api.delete(`/stores/${targetStore.id}`)     
            .then(response => {                      
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)
                dispatch(remove({ indexes: storeIndex }))
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})               
            })          
    }, [storeIndex, dispatch, store])

    useEffect(() => {
        if(store.isLoaded === false){
            getStores(reset)
        }
    }, [store, getStores])    

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     

    useEffect(() => {
        setPageHeading({title: 'Stores', icon: 'ecm004'})
    }, [])

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
                <div className='flex-row items-center'>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: store.filters.name, placeholder: loc.searchStore, 
                            onChange: e => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStores(reset)})}
                        }} 
                    />   
                    <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getStores(reset)}
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
                    disableBtn={disableBtn}
                    canLoadMore={store.canLoadMore}
                    action={() => {getStores(append)}}
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
                        value: store.filters.limit,
                        onChange: e => {dispatch(updateFilters([
                            {key: 'limit', value: e.target.value}
                        ]))}                            
                    }}
                    options={[
                        {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                    ]}
                />
            </>}        
            footer={
                <Button size={'sm'} text={loc.search} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStores(reset)}
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
        headings={['No', loc.name, loc.type, 'Actions']}
        body={stores.map((store, key) => ([
            (key + 1),
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

const LoadMoreBtn = ({canLoadMore, action, disableBtn}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
        onClick={action} disabled={disableBtn}>
            Load More
        </button> : ''        
    )
}

export default StorePage