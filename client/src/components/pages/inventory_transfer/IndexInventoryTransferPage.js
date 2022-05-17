import {useState, useEffect, useReducer, useCallback} from 'react'
import {ACTIONS, filterReducer, FILTER_ACTIONS, getFilters} from '../../reducers/InventoryTransferReducer'
import {api, errorHandler, getQueryString, keyHandler, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'
import {format} from 'date-fns'
import { Link } from 'react-router-dom'

function IndexInventoryTransferPage({invTransfer, dispatchInvTransfer, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    /* Create/edit invTransfer */
    const [invTransferIndex, setInvTransferIndex] = useState('')
    /* Delete invTransfer */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter invTransfer */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())    
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       

    const getInvTransfers = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(invTransfer.invTransfers !== null){
            setDisableBtn(true)
        }
        api.get(`/inventory-transfers${getQueryString(queries)}`)
           .then(response => {
                if(invTransfer.invTransfers !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                dispatchInvTransfer({type: actionType, payload: response.data})
                dispatchFilters({
                    type: FILTER_ACTIONS.RESET, payload: {
                        filters: response.data.filters
                    }
                })                
           })
           .catch(error => {
                if(invTransfer.stores !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [filters, invTransfer, dispatchInvTransfer])  

    const getStores = useCallback(() => {
        api.get(`/stores?onlyget=id,name`)
           .then(response => { setStores(response.data.stores) })
           .catch(error => { errorHandler(error)  })
    }, [])  

    const confirmDeleteInvTransfer = useCallback(index => {
        setInvTransferIndex(index)
        setPopupShown(true)
    }, [])

    const deleteInvTransfer = useCallback(() => {
        // Get the invTransfer 
        const targetInvTransfer = invTransfer.invTransfers[invTransferIndex]        

        api.delete(`/inventory-transfers/${targetInvTransfer.id}`)     
            .then(response => {        
                dispatchInvTransfer({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: invTransferIndex}
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
    }, [invTransferIndex, dispatchInvTransfer, invTransfer.invTransfers])

    useEffect(() => {
        if(invTransfer.invTransfers === null){
            getInvTransfers(ACTIONS.RESET)
        }
    }, [invTransfer, getInvTransfers])    

    useEffect(() => {
        if(stores === null){ getStores() }
    }, [stores, getStores])      

    // When the invTransfer resource is not set yet
    // Return loading UI
    if(invTransfer.invTransfers === null || stores === null){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Link to={'/inventory-transfers/create'}>
                <Button text={'Transfer'} size={'sm'} iconName={'share'}/>
            </Link>
        </section>
        <PlainCard 
            body={<>
                <div className='flex-row items-center' style={{marginBottom: '2rem'}}>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: 'Search inventory', 
                            onChange: e => {dispatchFilters({
                                type: FILTER_ACTIONS.UPDATE, payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getInvTransfers(ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInvTransfers(ACTIONS.RESET)}
                    }}/>                                       
                </div>            
                <InvTransfersTable 
                    invTransfers={invTransfer.invTransfers} 
                    confirmDeleteInvTransfer={confirmDeleteInvTransfer}
                />
                <LoadMoreBtn 
                    canLoadMore={invTransfer.canLoadMore}
                    action={() => {getInvTransfers(ACTIONS.APPEND)}}
                />                  
                {
                    invTransfer.canLoadMore ? 
                    <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
                    onClick={() => {getInvTransfers(ACTIONS.APPEND)}}>
                        Load More
                    </button> : ''
                }                
            </>}
        />
        <Modal
            heading={'Filter'}
            size={'sm'}
            body={
                <Grid numOfColumns={1} items={[
                    <Select label={'Origin store'} 
                        formAttr={{
                            value: filters.origin_store_id,
                            onChange: e => {dispatchFilters({
                                type: FILTER_ACTIONS.UPDATE, 
                                payload: {key: 'origin_store_id', value: e.target.value}
                            })}                            
                        }}
                        options={(() => {
                            const options = [{value: '', text: 'All'}]
                            stores.forEach(store => {
                                options.push({
                                    value: store.id, 
                                    text: store.name.charAt(0).toUpperCase() + store.name.slice(1)
                                })
                            })
                            return options
                        })()}
                    />,
                    <Select label={'Destination store'} 
                        formAttr={{
                            value: filters.destination_store_id,
                            onChange: e => {dispatchFilters({
                                type: FILTER_ACTIONS.UPDATE, 
                                payload: {key: 'destination_store_id', value: e.target.value}
                            })}                            
                        }}
                        options={(() => {
                            const options = [{value: '', text: 'All'}]
                            stores.forEach(store => {
                                options.push({
                                    value: store.id, 
                                    text: store.name.charAt(0).toUpperCase() + store.name.slice(1)
                                })
                            })
                            return options
                        })()}
                    />,     
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
                ]}/>
            }  
            footer={
                <Button size={'sm'} text={'Search'} attr={{
                        disabled: disableBtn,
                        onClick: () => {getInvTransfers(ACTIONS.RESET)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this transfer? All transfered inventories will be returned to the origin store'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteInvTransfer}
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

const InvTransfersTable = ({invTransfers, confirmDeleteInvTransfer}) => {
    return <Table
        headings={[
            'Inventory', 'Size', 'Amount', 'Origin Store', 
            'Destination Store', 'Transfer Date', 'Actions'
        ]}
        body={invTransfers.map((invTransfer, key) => ([
            <span className='text-capitalize'>{invTransfer.inventory.name}</span>,
            <span className='text-uppercase'>{invTransfer.inventorySize.name}</span>,
            formatNum(invTransfer.amount),
            <span className='text-capitalize'>{invTransfer.originStore.name}</span>,
            <span className='text-capitalize'>{invTransfer.destinationStore.name}</span>,
            format(new Date(invTransfer.transfer_date), 'eee, dd-MM-yyyy'),
            <>
                <Button 
                    size={'sm'} type={'light'} text={'Delete'} color={'red'}
                    attr={{onClick: () => {confirmDeleteInvTransfer(key)}}}                            
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

export default IndexInventoryTransferPage