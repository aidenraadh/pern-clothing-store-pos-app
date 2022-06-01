import {useState, useEffect, useReducer, useCallback, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {ACTIONS, filterReducer, getFilters} from '../../reducers/StoreTransactionReducer.js'
import TransactionReceipt from './TransactionReceipt'
import {api, errorHandler, formatNum, getQueryString} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {Radio, Select, TextInput} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import {format, startOfMonth , endOfMonth, startOfYear, endOfYear } from 'date-fns'


function IndexStoreTransactionPage({storeTrnsc, dispatchStoreTrnsc, user, loc}){
    const [disableBtn , setDisableBtn] = useState(false)  
    const ranges = useMemo(() => {
        const today = new Date()
        return {
            today: {
                label: 'Today',
                from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd')
            },
            thisMonth: {
                label: 'This month',
                from: format(startOfMonth(today), 'yyyy-MM-dd'),
                to: format(endOfMonth(today), 'yyyy-MM-dd')
            },
            thisYear: {
                label: 'This year',
                from: format(startOfYear(today), 'yyyy-MM-dd'),
                to: format(endOfYear(today), 'yyyy-MM-dd')
            },
            custom: {label: 'Custom', from: '', to: ''}
        }
    }, [])
    /* Filters */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters(storeTrnsc.isLoaded))    
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Transaction details */
    const [storeTrnscIndex, setStoreTrnscIndex] = useState('')
    const [viewStoreTrnscMdlShown, setViewStoreTrnscMdlShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')        
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')      
    /* Confirm delete popup */
    const [confirmDeletePopupShown, setConfirmDeletePopupShown] = useState(false)

    const [selectedRange, setSelectedRange] = useState(() => {
        let value = ''
        Object.entries(ranges).forEach(range => {
            const from = range[1].from
            const to = range[1].to
            if(from === filters.from && to === filters.to){
                value = range[0]
            }
        })
        return value
    })    

    const getStoreTrnscs = useCallback(actionType => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)
        if(storeTrnsc.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/store-transactions${getQueryString(queries)}`)
           .then(response => {
                if(storeTrnsc.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                dispatchStoreTrnsc({type: actionType, payload: response.data})  
                dispatchFilters({type: ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})            
           })
           .catch(error => {
                if(storeTrnsc.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [storeTrnsc, filters, dispatchStoreTrnsc])

    const viewStoreTrnsc = useCallback(index => {
        setStoreTrnscIndex(index)
        setViewStoreTrnscMdlShown(true)
    }, [])

    const confirmDeleteTransaction = useCallback(index => {
        setStoreTrnscIndex(index)
        setConfirmDeletePopupShown(true)
    }, [])    

    const deleteTransaction = useCallback(() => {
        // Get the store transaction
        const targetStoreTrnsc = storeTrnsc.storeTrnscs[storeTrnscIndex]
        api.delete(`/store-transactions/${targetStoreTrnsc.id}`)
           .then(response => {           
                setStoreTrnscIndex('')
                setSuccPopupMsg(response.data.message)             
                dispatchStoreTrnsc({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: storeTrnscIndex}
                })
                setSuccPopupShown(true)

           })
           .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                      
                }})  
           })        
    }, [storeTrnsc.storeTrnscs, storeTrnscIndex, dispatchStoreTrnsc])

    useEffect(() => {
        if(storeTrnsc.isLoaded === false){
            getStoreTrnscs(ACTIONS.RESET)
        }
    }, [getStoreTrnscs, storeTrnsc.isLoaded])

    if(storeTrnsc.isLoaded === false){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            {user.role.name === 'employee' ?
                <Link to={'/store-transactions/create'}>
                    <Button tag={'span'} text={loc.createTransaction} size={'sm'}/>
                </Link> : ''
            }
            {user.role.name === 'admin' ?
                <Button size={'sm'} text={'Filter'} iconName={'sort_1'} attr={{
                    onClick: () => {setFilterModalShown(true)}
                }}/> : ''
            }
        </section>
        <PlainCard 
            body={<>
                <StoreTrnscsTable
                    loc={loc}
                    storeTrnscs={storeTrnsc.storeTrnscs}
                    user={user}
                    viewHandler={viewStoreTrnsc}
                    deleteHandler={confirmDeleteTransaction}
                />
                <LoadMoreBtn
                    canLoadMore={storeTrnsc.canLoadMore}
                    action={() => {getStoreTrnscs(ACTIONS.APPEND)}}
                />
            </>}
        />
        <Modal
            heading={loc.transactionDetails}
            body={storeTrnsc.storeTrnscs[storeTrnscIndex] === undefined ? '' :
                <TransactionReceipt 
                    inventories={storeTrnsc.storeTrnscs[storeTrnscIndex].storeTrnscInvs}
                    objType={'sequelize'}
                    loc={loc}
                />
            }       
            shown={viewStoreTrnscMdlShown}
            toggleModal={() => {setViewStoreTrnscMdlShown(state => !state)}}
        />          
        <Modal
            heading={'Filter'}
            body={
                <Grid numOfColumns={1} items={[
                    <Select label={loc.store} 
                        options={(() => {
                            const options = [{value: '', text: loc.allStores}]
                            storeTrnsc.stores.forEach(store => {
                                options.push({
                                    value: store.id, text: store.name.charAt(0) + store.name.slice(1)
                                })
                            })
                            return options
                        })()}
                        formAttr={{
                            value: filters.store_id,
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'store_id', value: e.target.value}
                            })}                            
                        }}
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
                    />,               
                    <section>
                        <h6 className='text-medium text-dark-65' style={{fontSize: '1.64rem', marginBottom: '1rem'}}>Transaction Date</h6>
                        <hr style={{marginBottom: '1rem'}}/>
                        <div className='flex-row items-center flex-wrap'>
                            {Object.entries(ranges).map((range, index) => (
                                <Radio key={index} label={range[1].label} containerAttr={{style:{ margin: '0 1.4rem 1rem 0'}}}
                                formAttr={{value: range[0],
                                    checked: (range[0] === selectedRange ? true : false),
                                    onChange: () => {
                                        dispatchFilters({type: ACTIONS.FILTERS.UPDATE, payload: {
                                            key: 'from', value: range[1].from
                                        }})
                                        dispatchFilters({type: ACTIONS.FILTERS.UPDATE, payload: {
                                            key: 'to', value: range[1].to
                                        }})
                                        setSelectedRange(range[0])
                                    }
                                }}/>
                            ))}
                                                                       
                        </div>
                        <TextInput size={'md'} label={'From'} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date',
                            value: filters.from,
                            onChange: (e) => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'from', value: e.target.value}
                            })}
                        }}/>
                        <TextInput size={'md'} label={'To'} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date',
                            value: filters.to,
                            onChange: (e) => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'to', value: e.target.value}
                            })}
                        }}/>                         
                    </section>,                
                ]}/>
            }        
            footer={
                <Button size={'sm'} text={loc.search} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStoreTrnscs(ACTIONS.RESET)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />       
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={loc.removeTrnscMsg}
            confirmText={loc.remove}
            cancelText={loc.cancel}
            shown={confirmDeletePopupShown} 
            togglePopup={() => {setConfirmDeletePopupShown(state => !state)}} 
            confirmCallback={deleteTransaction}
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

const StoreTrnscsTable = ({loc, storeTrnscs, user, viewHandler, deleteHandler}) => {
    return <Table
        headings={['No', loc.store, loc.totalAmount, loc.totalCost, loc.trnscDate, 'Actions']}
        body={storeTrnscs.map((storeTrnsc, index) => ([
            (index + 1),
            <span className='text-capitalize'>
                {storeTrnsc.store.name}
            </span>, 
            formatNum(storeTrnsc.total_amount), 
            'Rp. '+formatNum(storeTrnsc.total_cost),
            format(new Date(storeTrnsc.transaction_date), 'eee, dd-MM-yyyy'),
            <span>
                <Button size={'sm'} text={loc.view} type={'light'} attr={{
                    style: {marginRight: '1.2rem'},
                    onClick: () => {viewHandler(index)}
                }} />
                {user.role.name === 'employee' ? 
                <Button size={'sm'} text={loc.remove} color={'red'} type={'light'} attr={{
                    onClick: () => {deleteHandler(index)}
                }} /> : ''                
                } 
            </span>          
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

export default IndexStoreTransactionPage
