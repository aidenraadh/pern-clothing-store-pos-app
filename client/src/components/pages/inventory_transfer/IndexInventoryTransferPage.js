import {useState, useEffect, useReducer, useCallback} from 'react'
import {ACTIONS, filterReducer, getFilters} from '../../reducers/InventoryTransferReducer'
import {api, errorHandler, getQueryString, keyHandler, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'
import {format} from 'date-fns'
import { Link } from 'react-router-dom'

function IndexInventoryTransferPage({invTransfer, dispatchInvTransfer, user, loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit invTransfer */
    const [invTransferIndex, setInvTransferIndex] = useState('')
    /* Delete invTransfer */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter invTransfer */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters(invTransfer.isLoaded)) 
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

        if(invTransfer.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/inventory-transfers${getQueryString(queries)}`)
           .then(response => {
               const responseData = response.data
               // When the user is employee, they cant search the inventory transfer from another store
               // they're not employed
               if(invTransfer.isLoaded){
                   setDisableBtn(false)
                   setFilterModalShown(false)
                }                          
               dispatchInvTransfer({type: actionType, payload: responseData})
               if(responseData.filters){
                    if(user.role.name === 'employee'){
                        responseData.filters.origin_store_id = user.storeEmployee.store_id
                    }                   
               }
               dispatchFilters({
                   type: ACTIONS.FILTERS.RESET, payload: {filters: responseData.filters}
                })                
           })
           .catch(error => {
                if(invTransfer.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [filters, invTransfer, dispatchInvTransfer, user])  

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
        if(invTransfer.isLoaded === false){
            getInvTransfers(ACTIONS.RESET)
        }
    }, [invTransfer, getInvTransfers])        

    // When the invTransfer resource is not set yet
    // Return loading UI
    if(invTransfer.isLoaded === false){
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
                        formAttr={{value: filters.name, placeholder: loc.searchInv, 
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getInvTransfers(ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInvTransfers(ACTIONS.RESET)}
                    }}/>                                       
                </div>            
                <InvTransfersTable 
                    loc={loc}
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
                    <Select label={loc.originStore} 
                        formAttr={{
                            disabled: (user.role.name === 'employee' ? true : false),
                            value: filters.origin_store_id,
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, 
                                payload: {key: 'origin_store_id', value: e.target.value}
                            })}                            
                        }}
                        options={(() => {
                            const options = [{value: '', text: 'All'}]
                            invTransfer.stores.forEach(store => {
                                options.push({
                                    value: store.id, 
                                    text: store.name.charAt(0).toUpperCase() + store.name.slice(1)
                                })
                            })
                            return options
                        })()}
                    />,
                    <Select label={loc.destinationStore} 
                        formAttr={{
                            value: filters.destination_store_id,
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, 
                                payload: {key: 'destination_store_id', value: e.target.value}
                            })}                            
                        }}
                        options={(() => {
                            const options = [{value: '', text: 'All'}]
                            invTransfer.stores.forEach(store => {
                                options.push({
                                    value: store.id, 
                                    text: store.name.charAt(0).toUpperCase() + store.name.slice(1)
                                })
                            })
                            return options
                        })()}
                    />,     
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
                ]}/>
            }  
            footer={
                <Button size={'sm'} text={loc.search} attr={{
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
            body={loc.deleteMsg}
            confirmText={loc.remove}
            cancelText={loc.cancel}
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

const InvTransfersTable = ({invTransfers, confirmDeleteInvTransfer, loc}) => {
    return <Table
        headings={[
            'No', loc.inv, loc.size, loc.amount, loc.originStore, 
            loc.destinationStore, loc.transferDate, 'Actions'
        ]}
        body={invTransfers.map((invTransfer, key) => ([
            (key + 1),
            <span className='text-capitalize'>{invTransfer.inventory.name}</span>,
            <span className='text-uppercase'>{invTransfer.inventorySize.name}</span>,
            formatNum(invTransfer.amount),
            <span className='text-capitalize'>{invTransfer.originStore.name}</span>,
            <span className='text-capitalize'>{invTransfer.destinationStore.name}</span>,
            format(new Date(invTransfer.transfer_date), 'eee, dd-MM-yyyy'),
            <>
                <Button 
                    size={'sm'} type={'light'} text={loc.delete} color={'red'}
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