import {useState, useEffect, useReducer, useCallback} from 'react'
import {Link} from 'react-router-dom'
import {ACTIONS, filterReducer, getFilters} from './../../reducers/StoreInventoryReducer'
import {api, errorHandler, getQueryString, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select, Checkbox} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Grid} from '../../Layouts'
import {Modal, ConfirmPopup} from '../../Windows'
import Table from '../../Table'

function IndexStoreInventoryPage({storeInv, dispatchStoreInv, user, loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Edit store inventory */
    const [storeInvIndex, setStoreInvIndex] = useState('')
    const [storeInvSizes, setStoreInvSizes] = useState('')
    const [modalShown, setModalShown] = useState(false)   
    /* Filters */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters(storeInv.isLoaded))    
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')        

    const getStoreInvs = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)
        if(storeInv.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/store-inventories${getQueryString(queries)}`)
           .then(response => {
                if(storeInv.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                     
                setStoreInvSizes('')     
                dispatchStoreInv({type: actionType, payload: response.data})  
                dispatchFilters({type: ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})              
           })
           .catch(error => {
                if(storeInv.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [storeInv, filters, dispatchStoreInv])    

    const viewStoreInv = useCallback((index) => {
        const targetStoreInv = storeInv.storeInvs[index]
        setStoreInvIndex(index)
        setStoreInvSizes(state => {
            const invSizes = []
            if(!targetStoreInv){ return invSizes }
            targetStoreInv.inventory.sizes.forEach(invSize => {
                // Get the store inventory size
                const storeInvSize = targetStoreInv.sizes.find(storeInvSize => (
                    parseInt(storeInvSize.inventory_size_id) === parseInt(invSize.id)
                ))
                if(storeInvSize){
                    invSizes.push({
                        ...storeInvSize,
                        sizeName: invSize.name, production_price: invSize.production_price,
                        selling_price: invSize.selling_price, isChanged: false              
                    })  
                }
            })
            return invSizes
        })
        setModalShown(true)
    }, [storeInv])
    
    const updateStoreInv = useCallback(() => {
        setDisableBtn(true)
        const targetStoreInv = storeInv.storeInvs[storeInvIndex]
        api.put(`/store-inventories/${targetStoreInv.id}`, {
                updatedSizes: storeInvSizes
            })
            .then(response => {
                dispatchStoreInv({
                    type: ACTIONS.REPLACE, 
                    payload: {storeInv: response.data.storeInv, index: storeInvIndex}
                })                 
                setSuccPopupMsg(response.data.message)
                setDisableBtn(false)
                setModalShown(false)    
                setSuccPopupShown(true)
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                     
                }})                  
            })
    }, [storeInvIndex, storeInvSizes, dispatchStoreInv, storeInv])   

    useEffect(() => {
        if(storeInv.isLoaded === false){
            getStoreInvs(ACTIONS.RESET)
        }
    }, [storeInv, getStoreInvs])


    // When the store resource is not set yet
    // Return loading UI
    if(storeInv.isLoaded === false){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            {user.role.name === 'employee' ? '' :
                <Link to={'/store-inventories/create'}>
                    <Button tag={'span'} text={loc.storeNew} size={'sm'}/>
                </Link>            
            }
        </section>
        <PlainCard 
            body={<>
                <div className='flex-row items-center'>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: loc.searchInvInStore, 
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStoreInvs(ACTIONS.RESET)})}
                        }} 
                    />   
                    <Button text={loc.search} size={'sm'} attr={{disabled: disableBtn,
                            style: {flexShrink: '0'},
                            onClick: () => {getStoreInvs(ACTIONS.RESET)}
                        }}
                    />                                       
                </div>
                <StoreInvs 
                    loc={loc}
                    storeInvs={storeInv.storeInvs} 
                    viewStoreInv={viewStoreInv}
                />
                <LoadMoreBtn 
                    canLoadMore={storeInv.canLoadMore}
                    action={() => {getStoreInvs(ACTIONS.APPEND)}}
                />              
            </>}
        />
        <Modal
            heading={loc.details}
            body={<>
                <Table
                    headings={(() => {
                        const headings = [loc.size, loc.quantity, loc.sellingPrice]
                        if(user.role.name === 'admin'){
                           headings.splice(2, 0, loc.productionPrice) 
                        }
                        return headings
                    })()}
                    body={(() => {
                        if(!storeInvSizes){ return [] }
                        if(user.role.name === 'admin'){
                            return storeInvSizes.map((size, index) => ([
                                <span className='text-uppercase'>
                                    {size.sizeName}
                                </span>,
                                <TextInput size={'md'}
                                    formAttr={{
                                        pattern: '[0-9]*', 
                                        value: size.amount,
                                        onChange: (e) => {setStoreInvSizes(state => {
                                            const sizes = [...state]
                                            sizes[index].amount = e.target.value
                                            sizes[index].isChanged = true
                                            return sizes
                                        })}
                                    }}
                                    containerAttr={{style: {width: '10rem'}}}
                                />,
                                `Rp. ${size.production_price ? formatNum(size.production_price) : '--'}`,
                                `Rp. ${size.selling_price ? formatNum(size.selling_price) : '--'}` 
                            ]))
                        }
                        if(user.role.name === 'employee'){
                            return storeInvSizes.map((size, index) => ([
                                <span className='text-capitalize'>{size.sizeName}</span>,
                                formatNum(size.amount ? size.amount : 0),
                                `Rp. ${formatNum(size.selling_price)}` 
                            ]))
                        }                        
                    })()}
                />
            </>}        
            footer={user.role.name === 'employee' ? '' :
                <Button size={'sm'} text={loc.saveChanges} attr={{
                    disabled: disableBtn,
                    onClick: () => {updateStoreInv()}
                }}/>                
            }
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />
        <Modal
            heading={'Filter'}
            size={'sm'}
            body={<Grid numOfColumns={1} 
                items={(() => {
                    const items = [
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
                        <Checkbox label={loc.showOnlyEmptySizes}
                            formAttr={{
                                defaultChecked: filters.empty_size_only,
                                onChange: (e) => {dispatchFilters({
                                    type: ACTIONS.FILTERS.UPDATE, payload: {
                                    key: 'empty_size_only', value: filters.empty_size_only
                                }}
                            )}
                        }}/>                        
                    ]
                    if(user.role.name === 'admin'){
                        items.unshift(
                            <Select label={loc.store} 
                                formAttr={{
                                    value: filters.store_id,
                                    onChange: e => {dispatchFilters({
                                        type: ACTIONS.FILTERS.UPDATE, payload: {key: 'store_id', value: e.target.value}
                                    })}                                       
                                }}
                                options={(() => {
                                    const options = [{value: '', text: loc.allStores}]
                                    storeInv.stores.forEach(store => {
                                        const capitalizeStoreName = store.name.charAt(0) + store.name.slice(1)
                                        options.push({value: store.id, text: capitalizeStoreName})
                                    })
                                    return options
                                })()}
                            />                 
                        )
                    }
                    return items                
                })()}
            />}
            footer={
                <Button size={'sm'} text={loc.search} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStoreInvs(ACTIONS.RESET)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
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

const StoreInvs = ({loc, storeInvs, viewStoreInv}) => {
    return (<>
        <div className="inventories-container">
            <Table
                headings={['No', loc.inventory, loc.store, loc.totalStored, 'Actions']}
                body={storeInvs.map((storeInv, index) => [
                    (index + 1),
                    <span className='text-capitalize'>{storeInv.inventory.name}</span>, 
                    <span className='text-capitalize'>{storeInv.store.name}</span>, 
                    storeInv.total_amount ? formatNum(storeInv.total_amount) : 0,
                    <>
                        <Button text={loc.view} size={'sm'} 
                            attr={{onClick: () => {viewStoreInv(index)}}}
                        />
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