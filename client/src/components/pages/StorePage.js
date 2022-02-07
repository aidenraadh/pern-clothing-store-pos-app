import {useState, useEffect} from 'react'
import {STORE_ACTIONS, STORE_FILTER_KEY} from '../reducers/StoreReducer'
import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'

function StorePage(props){
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
    const initFilters = getResFilters(STORE_FILTER_KEY)
    const [filters, setFilters] = useState({
        name: initFilters.name ? initFilters.name : '',
        limit: initFilters.limit ? initFilters.limit : 10, 
        offset: initFilters.offset ? initFilters.offset : 0, 
    })
    const [filterModalShown, setFilterModalShown] = useState(false)

    useEffect(() => {
        if(props.store.stores === null){
            getStores()
        }
    })
    const getStores = (actionType = '') => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === '' ? 0 : (queries.offset + queries.limit)

        if(props.store.stores !== null){
            setDisableBtn(true)
        }
        api.get(`/stores${getQueryString(queries)}`)
           .then(response => {
                if(props.store.stores !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                props.dispatchStore({type: actionType, payload: response.data})
           })
           .catch(error => {
                if(props.store.stores !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }    
    const createStore = () => {
        setStoreIndex('')
        setStoreId('')
        setStoreName('')
        setModalHeading('Create New Store')      
        setModalShown(true)
    } 
    const storeStore = () => {
        setDisableBtn(true)
        api.post('/stores', {name: storeName})
            .then(response => {
                setDisableBtn(false)
                setModalShown(false)           
                props.dispatchStore({
                    type: STORE_ACTIONS.PREPEND, 
                    payload: {stores: response.data.store}
                })
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {alert(error.response.data.message)}})           
            })           
    }    
    const editStore = (index, id, name) => {
        setStoreIndex(index)
        setStoreId(id)
        setStoreName(name)
        setModalHeading(`Edit ${name}`)
        setModalShown(true)
    }    
    const updateStore = () => {
        setDisableBtn(true)   
        api.put(`/stores/${storeId}`, {name: storeName})     
            .then(response => {
                setDisableBtn(false)
                setModalShown(false)            
                props.dispatchStore({
                    type: STORE_ACTIONS.REPLACE, 
                    payload: {store: response.data.store, index: storeIndex}
                })                
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {alert(error.response.data.message)}})               
            })        
    }    
    const confirmDeleteStore = (id, index) => {
        setStoreId(id)
        setStoreIndex(index)
        setPopupShown(true)
    }   
    const deleteStore = () => {
        api.delete(`/stores/${storeId}`)     
            .then(response => {        
                props.dispatchStore({
                    type: STORE_ACTIONS.REMOVE, 
                    payload: {indexes: storeIndex}
                })                
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {alert(error.response.data.message)}})               
            })          
    }
    // When the store resource is not set yet
    // Return loading UI
    if(props.store.stores === null){
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
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: 'Search store', onChange: (e) => {
                                setFilters(state => ({...state, name: e.target.value}))
                            }
                        }} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                            style: {flexShrink: '0'},
                            onClick: () => {getStores()}
                        }}
                    />                                       
                </div>            
                <GenerateStores 
                    stores={props.store.stores} 
                    editStore={editStore}
                    confirmDeleteStore={confirmDeleteStore}
                />
                <LoadMoreBtn 
                    canLoadMore={props.store.canLoadMore}
                    action={() => {getStores(STORE_ACTIONS.APPEND)}}
                />                  
                {
                    props.store.canLoadMore ? 
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
                    formAttr={{value: storeName, onChange: (e) => {setStoreName(e.target.value)}}}
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
                        onChange: e => {
                            setFilters(state => ({...state, limit: parseInt(e.target.value)}))
                        }
                    }}
                    options={[
                        {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                    ]}
                />
            </>}        
            footer={
                <Button size={'sm'} text={'Search'} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStores()}
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
    </>)
}

const GenerateStores = ({stores, editStore, confirmDeleteStore}) => {
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