import {useState, useEffect} from 'react'
import {STOREINV_ACTIONS, STOREINV_FILTER_KEY} from '../reducers/StoreInventoryReducer'
import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'

function StoreInventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Edit store */
    const [storeInvIndex, setStoreInvIndex] = useState('')
    const [invId, setInvId] = useState('')
    const [storeId, setStoreId] = useState('')
    const [invAmount, setInvAmount] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Delete store */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter store */
    const initFilters = getResFilters(STOREINV_FILTER_KEY)
    const [filters, setFilters] = useState({
        store_id: initFilters.store_id ? initFilters.store_id : '',
        limit: initFilters.limit ? initFilters.limit : 10, 
        offset: initFilters.offset ? initFilters.offset : 0, 
    })
    const [filterModalShown, setFilterModalShown] = useState(false)

    useEffect(() => {
        if(props.storeInv.storeInvs === null){
            getStoreInv()
        }
    }, [])
    const getStoreInv = (actionType = '') => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === '' ? 0 : (queries.offset + queries.limit)

        if(props.storeInv.storeInvs !== null){
            setDisableBtn(true)
        }
        api.get(`/store-inventories${getQueryString(queries)}`)
           .then(response => {
                if(props.storeInv.storeInvs !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                props.dispatchStoreInv({type: actionType, payload: response.data})
           })
           .catch(error => {
                if(props.storeInv.storeInvs !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }    

    const editStoreInv = (index, invId, storeId) => {
        setStoreInvIndex(index)
        setInvId(invId)
        setStoreId(storeId)
        setModalShown(true)
    }

    const storeStoreInv = () => {
        setDisableBtn(true)         
    }     
    // const updateStoreInv = () => {
    //     setDisableBtn(true)   
    //     api.put(`/store-inventories/${storeId}`, {name: storeName})     
    //         .then(response => {
    //             setDisableBtn(false)
    //             setModalShown(false)            
    //             props.dispatchStore({
    //                 type: STORE_ACTIONS.REPLACE, 
    //                 payload: {store: response.data.store, index: storeInvIndex}
    //             })                
    //         })
    //         .catch(error => {
    //             setDisableBtn(false)
    //             errorHandler(error, {'400': () => {alert(error.response.data.message)}})               
    //         })        
    // }    
    // const confirmDeleteStoreInv = (id, index) => {
    //     setStoreId(id)
    //     setStoreInvIndex(index)
    //     setPopupShown(true)
    // }   
    // const deleteStoreInv = () => {
    //     api.delete(`/stores/${storeId}`)     
    //         .then(response => {        
    //             props.dispatchStore({
    //                 type: STORE_ACTIONS.REMOVE, 
    //                 payload: {indexes: storeInvIndex}
    //             })                
    //         })
    //         .catch(error => {
    //             setDisableBtn(false)
    //             errorHandler(error, {'400': () => {alert(error.response.data.message)}})               
    //         })          
    // }
    // When the store resource is not set yet
    // Return loading UI
    if(props.storeInv.storeInvs === null){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={'+ Create'} size={'sm'} attr={{onClick: () => {}}}/>
        </section>
        <PlainCard
            body={<>
                <GenerateStoreInv 
                    storeInvs={props.storeInv.storeInvs} 
                />
                {
                    props.storeInv.canLoadMore ? 
                    <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
                    onClick={() => {getStoreInv(STOREINV_ACTIONS.APPEND)}}>
                        Load More
                    </button> : ''
                }                
            </>}
        />
        <Modal
            heading={'Edit Amount'}
            body={<>
                <Table
                    headings={['Size', 'Quantity', 'Production Price', 'Selling Price']}
                    body={invAmount ?
                        (() => {
                            const storeInv = props.storeInv.storeInvs[storeInvIndex]

                        })()
                    : ''}
                />
            </>}        
            footer={
                <Button size={'sm'} text={'Save Changes'} attr={{
                        disabled: disableBtn,
                        onClick: () => {updateStoreInv()}
                    }}
                />                
            }
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />
        <Modal
            heading={'Filter'}
            body={<>
                <Select label={'Store'} 
                    formAttr={{
                        value: filters.store_id,
                        onChange: e => {
                            setFilters(state => ({...state, store_id: parseInt(e.target.value)}))
                        }
                    }}
                    options={props.storeInv.stores.map(store => ({
                        value: store.id, text: store.name
                    }))}
                />            
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
                        onClick: () => {getStoreInv()}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />        
        {/* <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this store?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteStoreInv}
        /> */}
    </>)
}

const GenerateStoreInv = ({storeInvs, editStoreInv, confirmDeleteStoreInv}) => {
    return (<>
        <div className="inventories-container">
            <Table
                headings={['Inventory', 'Store']}
                body={storeInvs.map(storeInv => [
                    storeInv.inventory.name, storeInv.store.name 
                ])}
            />
        </div>    
    </>)
}

export default StoreInventoryPage