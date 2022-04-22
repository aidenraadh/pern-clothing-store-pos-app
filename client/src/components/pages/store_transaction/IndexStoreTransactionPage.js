import {useState, useEffect, useReducer, useCallback} from 'react'
import {Link} from 'react-router-dom'
import {STORETRNSC_FILTER_KEY, STORETRNSC_ACTIONS} from '../../reducers/StoreTransactionReducer.js'
import TransactionReceipt from './TransactionReceipt'
import {api, errorHandler, formatNum, getResFilters, getQueryString} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {format} from 'date-fns'


function IndexStoreTransactionPage({storeTrnsc, dispatchStoreTrnsc, user}){
    const [disableBtn , setDisableBtn] = useState(false)  
    /* Filter store transactions */
    const [filters, dispatchFilters] = useReducer(filterReducer, (() => {
        const initState = getResFilters(STORETRNSC_FILTER_KEY)
        return {
            name: initState.name ? initState.name : '',
            limit: initState.limit ? initState.limit : 10, 
            offset: initState.offset ? initState.offset : 0,             
        }
    })())
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

    const getStoreTrnscs = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === STORETRNSC_ACTIONS.RESET ? 0 : (queries.offset + queries.limit)
        if(storeTrnsc.storeTrnscs !== null){
            setDisableBtn(true)
        }
        api.get(`/store-transactions${getQueryString(queries)}`)
           .then(response => {
                if(storeTrnsc.storeTrnscs !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                dispatchStoreTrnsc({type: actionType, payload: response.data})
                dispatchFilters({
                    type: 'reset', payload: getResFilters(STORETRNSC_FILTER_KEY)
                })                
           })
           .catch(error => {
                if(storeTrnsc.storeTrnscs !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [filters, storeTrnsc, dispatchStoreTrnsc])

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
                    type: STORETRNSC_ACTIONS.REMOVE, 
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
    }, [storeTrnsc.storeTrnscs, storeTrnscIndex])

    useEffect(() => {
        if(storeTrnsc.storeTrnscs === null){
            getStoreTrnscs(STORETRNSC_ACTIONS.RESET)
        }
    }, [getStoreTrnscs, storeTrnsc.storeTrnscs])

    if(storeTrnsc.storeTrnscs === null){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            {user.role.name === 'employee' ?
                <Link to={'/store-transactions/create'}>
                    <Button tag={'span'} text={'+ New transaction'} size={'sm'}/>
                </Link> : ''
            }            
        </section>
        <PlainCard 
            body={<>
                <StoreTrnscsTable
                    storeTrnscs={storeTrnsc.storeTrnscs}
                    user={user}
                    viewHandler={viewStoreTrnsc}
                    deleteHandler={confirmDeleteTransaction}
                />
                <LoadMoreBtn
                    canLoadMore={storeTrnsc.canLoadMore}
                    action={() => {getStoreTrnscs(STORETRNSC_ACTIONS.APPEND)}}
                />
            </>}
        />
        <Modal
            heading={'Transaction Detail'}
            body={storeTrnscIndex === '' ? '' :
                <TransactionReceipt 
                    inventories={storeTrnsc.storeTrnscs[storeTrnscIndex].storeTrnscInvs}
                    objType={'sequelize'}
                />
            }       
            shown={viewStoreTrnscMdlShown}
            toggleModal={() => {setViewStoreTrnscMdlShown(state => !state)}}
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
                        onClick: () => {getStoreTrnscs(STORETRNSC_ACTIONS.RESET)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />       
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this transaction?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
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

const StoreTrnscsTable = ({storeTrnscs, user, viewHandler, deleteHandler}) => {
    return <Table
        headings={['No', 'Store', 'Total Amount', 'Total Cost', 'Transaction Date', 'Actions']}
        body={storeTrnscs.map((storeTrnsc, index) => ([
            (index + 1),
            storeTrnsc.store.name, 
            formatNum(storeTrnsc.total_amount), 
            'Rp. '+formatNum(storeTrnsc.total_cost),
            format(new Date(storeTrnsc.transaction_date), 'eee, dd-MM-yyyy'),
            <span>
                <Button size={'sm'} text={'View'} type={'light'} attr={{
                    style: {marginRight: '1.2rem'},
                    onClick: () => {viewHandler(index)}
                }} />
                {user.role.name === 'employee' ? 
                <Button size={'sm'} text={'Delete'} color={'red'} type={'light'} attr={{
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
