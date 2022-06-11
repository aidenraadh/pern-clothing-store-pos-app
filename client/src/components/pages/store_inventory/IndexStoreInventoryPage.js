import {useState, useEffect, useCallback} from 'react'
import {Link} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {append, replace, updateFilters, syncFilters, reset} from '../../../features/storeInventorySlice'
import {api, errorHandler, getQueryString, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select, Checkbox} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Grid} from '../../Layouts'
import {Modal, ConfirmPopup} from '../../Windows'
import Table from '../../Table'

function IndexStoreInventoryPage({user, loc}){
    const storeInv = useSelector(state => state.storeInv)
    const dispatch = useDispatch()        
    const [disableBtn , setDisableBtn] = useState(false)
    /* Edit store inventory */
    const [storeInvIndex, setStoreInvIndex] = useState('')
    const [storeInvSizes, setStoreInvSizes] = useState([])
    const [modalShown, setModalShown] = useState(false)   
    /* Filters */
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')        

    const getStoreInvs = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...storeInv.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...storeInv.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/store-inventories${getQueryString(queries)}`)
           .then(response => {
               const responseData = response.data
                setDisableBtn(false)
                setFilterModalShown(false)                   
                setStoreInvSizes([])     
                dispatch(actionType({
                    storeInvs: responseData.storeInvs,
                    stores: responseData.stores,
                    filters: responseData.filters
                }))                                
           })
           .catch(error => {
                setDisableBtn(false)
                setFilterModalShown(false)
                errorHandler(error) 
           })
    }, [storeInv, dispatch])    

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
                    const sizeDetails = {
                        ...storeInvSize,
                        sizeName: invSize.name, isChanged: false                            
                    }
                    sizeDetails.amount = sizeDetails.amount ? sizeDetails.amount : ''
                    // For admin
                    if(parseInt(user.role_id) === 2){
                        sizeDetails.production_price = invSize.production_price ? invSize.production_price : ''
                    }
                    // For regular store
                    if(parseInt(targetStoreInv.store.type_id) === 1){
                        sizeDetails.selling_price = invSize.selling_price ? invSize.selling_price : ''
                    }
                    invSizes.push(sizeDetails)  
                }
            })
            return invSizes
        })
        setModalShown(true)
    }, [storeInv, user])
    
    const updateStoreInv = useCallback(() => {
        setDisableBtn(true)
        const targetStoreInv = storeInv.storeInvs[storeInvIndex]
        api.put(`/store-inventories/${targetStoreInv.id}`, {
                updatedSizes: storeInvSizes
            })
            .then(response => {
                dispatch(replace({
                    storeInv: response.data.storeInv, index: storeInvIndex
                }))                
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
    }, [storeInvIndex, storeInvSizes, dispatch, storeInv])   

    useEffect(() => {
        if(storeInv.isLoaded === false){
            getStoreInvs(reset)
        }
    }, [storeInv, getStoreInvs])

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])      

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
                        formAttr={{value: storeInv.filters.name, placeholder: loc.searchInvInStore, 
                            onChange: e => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getStoreInvs(reset)})}
                        }} 
                    />   
                    <Button text={loc.search} size={'sm'} attr={{disabled: disableBtn,
                            style: {flexShrink: '0'},
                            onClick: () => {getStoreInvs(reset)}
                        }}
                    />                                       
                </div>
                <StoreInvs 
                    loc={loc}
                    storeInvs={storeInv.storeInvs} 
                    viewStoreInv={viewStoreInv}
                />
                <LoadMoreBtn 
                    disableBtn={disableBtn}
                    canLoadMore={storeInv.canLoadMore}
                    action={() => {getStoreInvs(append)}}
                />              
            </>}
        />
        <Modal
            heading={loc.details}
            body={<>
                <Table
                    headings={(() => {
                        const headings = [loc.size, loc.quantity]
                        if(storeInvSizes.length){
                            if(storeInvSizes[0].selling_price !== undefined){
                                headings.splice(2, 0, loc.sellingPrice) 
                            }                      
                            if(storeInvSizes[0].production_price !== undefined){
                                headings.splice(2, 0, loc.productionPrice) 
                            }                    
                        }
                        return headings
                    })()}
                    body={storeInvSizes.map((size, index) => {
                        const row = [
                            <span className='text-uppercase'>{size.sizeName}</span>                            
                        ]
                        // For admin, can change the amount of the size
                        if(parseInt(user.role_id) === 2){
                            row.push(
                                <TextInput size={'md'}
                                    formAttr={{
                                        pattern: '[0-9]*', value: size.amount,
                                        onChange: (e) => {setStoreInvSizes(state => {
                                            const sizes = [...state]
                                            sizes[index].amount = e.target.value
                                            sizes[index].isChanged = true
                                            return sizes
                                        })}
                                    }}
                                    containerAttr={{style: {width: '10rem'}}}
                                />
                            )
                        }
                        else{
                            row.push(
                                formatNum(size.amount ? size.amount : 0)
                            )
                        }
                        if(size.production_price !== undefined){
                            row.push(
                                `Rp. ${formatNum(size.production_price)}`
                            )
                        }
                        if(size.selling_price !== undefined){
                            row.push(
                                `Rp. ${formatNum(size.selling_price)}`
                            )
                        }     
                        return row                   
                    })}
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
                                value: storeInv.filters.limit,
                                onChange: e => {dispatch(updateFilters([
                                    {key: 'limit', value: e.target.value}
                                ]))}                                   
                            }}
                            options={[
                                {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                            ]}
                        />,
                        <Checkbox label={loc.showOnlyEmptySizes}
                            formAttr={{
                                defaultChecked: storeInv.filters.empty_size_only,
                                onChange: (e) => {dispatch(updateFilters([
                                    {key: 'empty_size_only', value: storeInv.filters.empty_size_only}
                                ]))}
                        }}/>                        
                    ]
                    if(user.role.name === 'admin'){
                        items.unshift(
                            <Select label={loc.store} 
                                formAttr={{
                                    value: storeInv.filters.store_id,
                                    onChange: e => {dispatch(updateFilters([
                                        {key: 'store_id', value: e.target.value}
                                    ]))}                                       
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
                        onClick: () => {getStoreInvs(reset)}
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
                headings={['No', loc.inventory, loc.storeOrStorage, loc.totalStored, 'Actions']}
                body={storeInvs.map((storeInv, index) => [
                    (index + 1),
                    <span className='text-capitalize'>{storeInv.inventory.name}</span>, 
                    <span className='text-capitalize'>{storeInv.store.name}</span>, 
                    storeInv.total_amount ? formatNum(storeInv.total_amount) : 0,
                    <>
                        <Button text={loc.view} type={'light'} size={'sm'} 
                            attr={{onClick: () => {viewStoreInv(index)}}}
                        />
                    </>
                ])}
            />
        </div>    
    </>)
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

export default IndexStoreInventoryPage