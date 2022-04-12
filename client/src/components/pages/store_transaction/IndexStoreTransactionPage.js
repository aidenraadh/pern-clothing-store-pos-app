import {useState, useEffect, useReducer, useCallback} from 'react'
import {STORETRNSC_FILTER_KEY, STORETRNSC_ACTIONS} from '../../reducers/StoreTransactionReducer.js'
import {api, errorHandler, formatNum, getResFilters, getQueryString, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'

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
    /* */
    const [storeTrnscIndex, setStoreTrnscIndex] = useState('')
    const [viewStoreTrnscMdlShown, setViewStoreTrnscMdlShown] = useState(false)

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

    useEffect(() => {
        if(storeTrnsc.storeTrnscs === null){
            getStoreTrnscs(STORETRNSC_ACTIONS.RESET)
        }
    }, [getStoreTrnscs, storeTrnsc.storeTrnscs])

    if(storeTrnsc.storeTrnscs === null){
        return 'Loading...'
    }    
    return (<>
        <PlainCard
            body={<>
                <GenerateStoreTrnscs
                    storeTrnscs={storeTrnsc.storeTrnscs}
                    viewHandler={viewStoreTrnsc}
                />
                <LoadMoreBtn
                    canLoadMore={storeTrnsc.canLoadMore}
                    action={() => {getStoreTrnscs(STORETRNSC_ACTIONS.APPEND)}}
                />
            </>}
        />
        <Modal
            heading={'Transaction Detail'}
            body={(() => {
                if(storeTrnscIndex === ''){ return '' }
                const targetStoreTrnsc = storeTrnsc.storeTrnscs[storeTrnscIndex]
                return <Table 
                    headings={['Inventory', 'Size', 'Amount', 'Cost per Item', 'Total Cost', 'Original Cost']}
                    body={targetStoreTrnsc.storeTrnscInvs.map(storeTrnscInv => ([
                        storeTrnscInv.inventory.name,
                        storeTrnscInv.size.id,
                        formatNum(storeTrnscInv.amount),
                        formatNum(storeTrnscInv.original_cost/storeTrnscInv.amount),
                        formatNum(storeTrnscInv.cost),
                        formatNum(storeTrnscInv.original_cost),
                    ]))}
                />
            })()}        
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

const GenerateStoreTrnscs = ({storeTrnscs, viewHandler}) => {
    return <Table
        headings={['Store', 'Total Amount', 'Total Cost', 'Transaction Date', 'Actions']}
        body={storeTrnscs.map((storeTrnsc, index) => ([
            storeTrnsc.store.name, formatNum(storeTrnsc.total_amount), 
            formatNum(storeTrnsc.total_cost),
            storeTrnsc.transaction_date, 
            <Button size={'sm'} text={'View'} attr={{
                onClick: () => {viewHandler(index)}
            }} />
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