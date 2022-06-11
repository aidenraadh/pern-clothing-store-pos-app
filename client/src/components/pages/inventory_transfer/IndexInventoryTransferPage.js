import {useState, useEffect, useCallback, useMemo} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {append, remove, updateFilters, syncFilters, reset} from '../../../features/inventoryTransferSlice'
import {api, errorHandler, getQueryString, keyHandler, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select, Radio} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'
import {format, startOfMonth , endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Link } from 'react-router-dom'

function IndexInventoryTransferPage({user, loc}){
    const invTransfer = useSelector(state => state.invTransfer)
    const dispatch = useDispatch()        
    const [disableBtn , setDisableBtn] = useState(false)
    const ranges = useMemo(() => {
        const today = new Date()
        return {
            today: {
                label: loc.today,
                from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd')
            },
            thisMonth: {
                label: loc.thisMonth,
                from: format(startOfMonth(today), 'yyyy-MM-dd'),
                to: format(endOfMonth(today), 'yyyy-MM-dd')
            },
            thisYear: {
                label: loc.thisYear,
                from: format(startOfYear(today), 'yyyy-MM-dd'),
                to: format(endOfYear(today), 'yyyy-MM-dd')
            },
            custom: {label: loc.custom, from: '', to: ''}
        }
    }, [loc.today, loc.thisMonth, loc.thisYear, loc.custom])    
    /* Create/edit invTransfer */
    const [invTransferIndex, setInvTransferIndex] = useState('')
    /* Delete invTransfer */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter invTransfer */
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    
    
    const [selectedRange, setSelectedRange] = useState('custom')       

    const getInvTransfers = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...invTransfer.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...invTransfer.lastFilters}
            queries.offset += queries.limit 
        }
        api.get(`/inventory-transfers${getQueryString(queries)}`)
           .then(response => {
               const responseData = response.data
               setDisableBtn(false)
               setFilterModalShown(false)          
               dispatch(actionType({
                invTransfers: responseData.invTransfers,
                stores: responseData.stores,
                filters: responseData.filters
               }))                                              
           })
           .catch(error => {
                setDisableBtn(false)
                setFilterModalShown(false)
                errorHandler(error) 
           })
    }, [invTransfer, dispatch])  

    const confirmDeleteInvTransfer = useCallback(index => {
        setInvTransferIndex(index)
        setPopupShown(true)
    }, [])

    const deleteInvTransfer = useCallback(() => {
        // Get the invTransfer 
        const targetInvTransfer = invTransfer.invTransfers[invTransferIndex]        

        api.delete(`/inventory-transfers/${targetInvTransfer.id}`)     
            .then(response => {                     
                dispatch(remove({
                    indexes: invTransferIndex
                }))                  
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
    }, [invTransferIndex, dispatch, invTransfer])

    useEffect(() => {
        setSelectedRange(state => {
            let value = state
            Object.entries(ranges).forEach(range => {
                const from = range[1].from
                const to = range[1].to
                if(from === invTransfer.filters.from && to === invTransfer.filters.to){
                    value = range[0]
                }
            })
            return value            
        })        
        if(invTransfer.isLoaded === false){
            getInvTransfers(reset)
        }
    }, [invTransfer, getInvTransfers, ranges])   
    
    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     

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
                        formAttr={{value: invTransfer.filters.name, placeholder: loc.searchInv, 
                            onChange: e => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getInvTransfers(reset)})}
                        }} 
                    />   
                    <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInvTransfers(reset)}
                    }}/>                                       
                </div>            
                <InvTransfersTable 
                    loc={loc}
                    invTransfers={invTransfer.invTransfers} 
                    confirmDeleteInvTransfer={confirmDeleteInvTransfer}
                />
                <LoadMoreBtn 
                    disableBtn={disableBtn}
                    canLoadMore={invTransfer.canLoadMore}
                    action={() => {getInvTransfers(append)}}
                />                                
            </>}
        />
        <Modal
            heading={'Filter'}
            body={
                <Grid numOfColumns={1} items={[
                    <Select label={loc.originStore} 
                        formAttr={{
                            disabled: (user.role.name === 'employee' ? true : false),
                            value: invTransfer.filters.origin_store_id,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'origin_store_id', value: e.target.value}
                            ]))}                            
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
                            value: invTransfer.filters.destination_store_id,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'destination_store_id', value: e.target.value}
                            ]))}                            
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
                            value: invTransfer.filters.limit,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'limit', value: e.target.value}
                            ]))}                            
                        }}
                        options={[
                            {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                        ]}
                    />,
                    <section>
                        <h6 className='text-medium text-dark-65 text-capitalize' style={{fontSize: '1.56rem', marginBottom: '1rem'}}>
                            {loc.trnscDate}
                        </h6>
                        <hr style={{marginBottom: '1rem'}}/>
                        <div className='flex-row items-center wrap'>
                            {Object.entries(ranges).map((range, index) => (
                                <Radio key={index} label={range[1].label} containerAttr={{style:{ margin: '0 1.4rem 1rem 0'}}}
                                formAttr={{value: range[0],
                                    checked: (range[0] === selectedRange ? true : false),
                                    onChange: () => {
                                        dispatch(updateFilters([
                                            {key: 'from', value: range[1].from},
                                            {key: 'to', value: range[1].to}
                                        ]))
                                    }
                                }}/>
                            ))}
                                                                       
                        </div>
                        <TextInput size={'md'} label={loc.from} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRange !== 'custom' ? true : false,
                            value: invTransfer.filters.from,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'from', value: e.target.value}
                            ]))}
                        }}/>
                        <TextInput size={'md'} label={loc.to} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRange !== 'custom' ? true : false,
                            value: invTransfer.filters.to,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'to', value: e.target.value}
                            ]))}
                        }}/>                         
                    </section>,                                               
                ]}/>
            }  
            footer={
                <Button size={'sm'} text={loc.search} attr={{
                        disabled: disableBtn,
                        onClick: () => {getInvTransfers(reset)}
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

const LoadMoreBtn = ({canLoadMore, action, disableBtn}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1rem auto 0'}} 
        onClick={action} disabled={disableBtn}>
            Load More
        </button> : ''        
    )
}

export default IndexInventoryTransferPage