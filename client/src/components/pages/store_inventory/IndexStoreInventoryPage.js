import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {STOREINV_ACTIONS, STOREINV_FILTER_KEY} from './../../reducers/StoreInventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import Table from '../../Table'

function IndexStoreInventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Edit store */
    const [storeInvIndex, setStoreInvIndex] = useState('')
    const [storeInvSizes, setStoreInvSizes] = useState('')
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

    const editStoreInv = (index) => {
        const storeInv = props.storeInv.storeInvs[index]
        setStoreInvIndex(index)
        setStoreInvSizes(state => {
            const invSizes = []
            if(!storeInv){ return invSizes }
            // Get all stored inventory's sizes
            const storedSizeIds = storeInv.sizes.map(storedSize => storedSize.inventory_size_id)

            storeInv.inventory.sizes.forEach(size => {
                // When the stored size exists inside inventory sizes
                if(storedSizeIds.includes(size.id)){
                    invSizes.push({
                        ...storeInv.sizes[ storedSizeIds.indexOf(size.id) ],
                        name: size.name, production_price: size.production_price,
                        selling_price: size.selling_price,                        
                    })
                }
                else{
                    invSizes.push({
                        id: '', inventory_size_id: size.id, amount: '', 
                        name: size.name, production_price: size.production_price,
                        selling_price: size.selling_price,
                    })
                }
            })
            return invSizes
        })
        setModalShown(true)
    } 
    
    const updateStoreInv = () => {
        setDisableBtn(true)
        const storeInv = props.storeInv.storeInvs[storeInvIndex]
        api.put(`/store-inventories/${storeInv.id}`, {
                updated_sizes: JSON.stringify(storeInvSizes)
            })
            .then(response => {
                setDisableBtn(false)
                setModalShown(false)            
                props.dispatchStoreInv({
                    type: STOREINV_ACTIONS.REPLACE, 
                    payload: {storeInv: response.data.storeInv, index: storeInvIndex}
                })  
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {alert(error.response.data.message)}})                  
            })
    }       
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
            <Link to={'/store-inventories/create'}>
                <Button tag={'span'} text={'+ Create'} size={'sm'} attr={{onClick: () => {}}}/>
            </Link>
        </section>
        <PlainCard
            body={<>
                <GenerateStoreInv 
                    storeInvs={props.storeInv.storeInvs} 
                    editStoreInv={editStoreInv}
                />
                <LoadMoreBtn 
                    canLoadMore={props.storeInv.canLoadMore}
                    action={() => {getStoreInv(STOREINV_ACTIONS.APPEND)}}
                />              
            </>}
        />
        <Modal
            heading={'Edit Amount'}
            body={<>
                <Table
                    headings={['Size', 'Quantity', 'Production Price', 'Selling Price']}
                    body={(() => {
                        if(!storeInvSizes){ return [] }

                        return storeInvSizes.map((size, index) => ([
                            size.name,
                            <TextInput size={'sm'}
                                formAttr={{
                                    pattern: '[0-9]*', 
                                    value: size.amount,
                                    onChange: (e) => {setStoreInvSizes(state => {
                                        const sizes = [...state]
                                        sizes[index].amount = e.target.value
                                        return sizes
                                    })}
                                }}
                                containerAttr={{style: {width: '10rem'}}}
                            />,
                            `Rp. ${formatNum(size.production_price)}`,
                            `Rp. ${formatNum(size.selling_price)}` 
                        ]))
                    })()}
                />
            </>}        
            footer={
                <Button size={'sm'} text={'Save Changes'} attr={{
                    disabled: disableBtn,
                    onClick: () => {updateStoreInv()}
                }}/>                
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
                    options={(() => {
                        const options = [{value: '', text: 'All'}]
                        props.storeInv.stores.forEach(store => {
                            options.push({value: store.id, text: store.name})
                        })
                        return options
                    })()}
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

const GenerateStoreInv = ({storeInvs, editStoreInv}) => {
    return (<>
        <div className="inventories-container">
            <Table
                headings={['Inventory', 'Store', 'Total Stored', 'Actions']}
                body={storeInvs.map((storeInv, index) => [
                    storeInv.inventory.name, storeInv.store.name, formatNum(storeInv.total_amount),
                    <>
                        <Button text={'Edit'} size={'sm'} attr={{onClick: () => {editStoreInv(index)}}} />
                    </>
                ])}
            />
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

export default IndexStoreInventoryPage