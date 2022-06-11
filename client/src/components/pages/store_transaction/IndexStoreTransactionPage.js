import {useState, useEffect, useCallback, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {append, remove, updateFilters, syncFilters, reset} from '../../../features/storeTransactionSlice'
import TransactionReceipt from './TransactionReceipt'
import {api, errorHandler, formatNum, getQueryString} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {Radio, Select, TextInput} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import {format, startOfMonth , endOfMonth, startOfYear, endOfYear } from 'date-fns'

function IndexStoreTransactionPage({user, loc}){
    const storeTrnsc = useSelector(state => state.storeTrnsc)
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
    /* Filters */
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

    const [selectedRange, setSelectedRange] = useState('custom')    

    const getStoreTrnscs = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...storeTrnsc.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...storeTrnsc.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/store-transactions${getQueryString(queries)}`)
           .then(response => {
                const responseData = response.data
                setDisableBtn(false)
                setFilterModalShown(false)                             
                dispatch(actionType({
                    storeTrnscs: responseData.storeTrnscs,
                    stores: responseData.stores,
                    filters: responseData.filters
                }))                      
           })
           .catch(error => {
                setDisableBtn(false)
                setFilterModalShown(false) 
                errorHandler(error) 
           })
    }, [storeTrnsc, dispatch])

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
                dispatch(remove({
                    indexes: storeTrnscIndex
                }))                
                setStoreTrnscIndex('')
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
    }, [storeTrnsc, storeTrnscIndex, dispatch])

    useEffect(() => {
        if(storeTrnsc.isLoaded === false){
            getStoreTrnscs(reset)
        }
        // Update selected range whenever 'from' or 'to' filters is updated
        setSelectedRange(state => {
            let value = state
            Object.entries(ranges).forEach(range => {
                const from = range[1].from
                const to = range[1].to
                if(from === storeTrnsc.filters.from && to === storeTrnsc.filters.to){
                    value = range[0]
                }
            })
            return value            
        })
    }, [getStoreTrnscs, storeTrnsc, ranges])

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])      

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
                    action={() => {getStoreTrnscs(append)}}
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
                            value: storeTrnsc.filters.store_id,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'store_id', value: e.target.value}
                            ]))}                            
                        }}
                    />,
                    <Select label={loc.rowsShown} 
                        formAttr={{
                            value: storeTrnsc.filters.limit,
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
                                    onChange: () => {dispatch(updateFilters([
                                        {key: 'from', value: range[1].from},
                                        {key: 'to', value: range[1].to}
                                    ]))}
                                }}/>
                            ))}
                                                                       
                        </div>
                        <TextInput size={'md'} label={loc.from} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRange !== 'custom' ? true : false,
                            value: storeTrnsc.filters.from,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'from', value: e.target.value}
                            ]))}
                        }}/>
                        <TextInput size={'md'} label={loc.to} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRange !== 'custom' ? true : false,
                            value: storeTrnsc.filters.to,
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
                        onClick: () => {getStoreTrnscs(reset)}
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
