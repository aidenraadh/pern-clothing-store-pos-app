import {useState, useEffect, useReducer} from 'react'
import {Link} from 'react-router-dom'
import {STOREINV_ACTIONS, STOREINV_FILTER_KEY} from './../../reducers/StoreInventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Grid} from '../../Layouts'
import {Modal, ConfirmPopup} from '../../Windows'
import Table from '../../Table'

function IndexStoreInventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Edit store inventory */
    const [storeInvIndex, setStoreInvIndex] = useState('')
    const [storeInvSizes, setStoreInvSizes] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Delete store inventory */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter store inventory */
    const [filters, dispatchFilters] = useReducer(filterReducer, (() => {
        const initState = getResFilters(STOREINV_FILTER_KEY)
        return {
            name: initState.name ? initState.name : '',
            store_id: initState.store_id ? initState.store_id : '',
            limit: initState.limit ? initState.limit : 10, 
            offset: initState.offset ? initState.offset : 0,             
        }
    })())     
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    

    useEffect(() => {
        if(props.storeInv.storeInvs === null){
            getStoreInvs()
        }
    }, [])

    const getStoreInvs = (actionType = '') => {
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
                dispatchFilters({
                    type: 'reset', payload: getResFilters(STOREINV_FILTER_KEY)
                })                  
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
                        selling_price: size.selling_price, isChanged: false              
                    })
                }
                else{
                    invSizes.push({
                        id: '', inventory_size_id: size.id, amount: '', 
                        name: size.name, production_price: size.production_price,
                        selling_price: size.selling_price, isChanged: false
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
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                     
                }})                  
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
            {props.user.role.name === 'employee' ? '' :
                <Link to={'/store-inventories/create'}>
                    <Button tag={'span'} text={'+ Store new'} size={'sm'} attr={{onClick: () => {}}}/>
                </Link>            
            }
        </section>
        <PlainCard
            body={<>
                <div className='flex-row items-center'>
                    <TextInput size={'md'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: filters.name, placeholder: 'Search inventory', 
                            onChange: e => {dispatchFilters({
                                type: 'update', payload: {key: 'name', value: e.target.value}
                            })},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', getStoreInvs)}
                        }} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                            style: {flexShrink: '0'},
                            onClick: () => {getStoreInvs()}
                        }}
                    />                                       
                </div>
                <GenerateStoreInv 
                    storeInvs={props.storeInv.storeInvs} 
                    editStoreInv={editStoreInv}
                />
                <LoadMoreBtn 
                    canLoadMore={props.storeInv.canLoadMore}
                    action={() => {getStoreInvs(STOREINV_ACTIONS.APPEND)}}
                />              
            </>}
        />
        <Modal
            heading={'Details'}
            body={<>
                <Table
                    headings={(() => {
                        const headings = ['Size', 'Quantity', 'Selling Price']
                        if(props.user.role.name === 'owner'){
                           headings.splice(2, 0, 'Production Price') 
                        }
                        return headings
                    })()}
                    body={(() => {
                        if(!storeInvSizes){ return [] }
                        if(props.user.role.name === 'owner'){
                            return storeInvSizes.map((size, index) => ([
                                size.name,
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
                                `Rp. ${formatNum(size.production_price)}`,
                                `Rp. ${formatNum(size.selling_price)}` 
                            ]))
                        }
                        if(props.user.role.name === 'employee'){
                            return storeInvSizes.map((size, index) => ([
                                size.name,
                                formatNum(size.amount),
                                `Rp. ${formatNum(size.selling_price)}` 
                            ]))
                        }                        
                    })()}
                />
            </>}        
            footer={props.user.role.name === 'employee' ? '' :
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
            body={<Grid num_of_columns={1} 
                items={(() => {
                    const items = [
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
                    ]
                    if(props.user.role.name === 'owner'){
                        items.unshift(
                            <Select label={'Store'} 
                                formAttr={{
                                    value: filters.store_id,
                                    onChange: e => {dispatchFilters({
                                        type: 'update', payload: {key: 'store_id', value: e.target.value}
                                    })}                                       
                                }}
                                options={(() => {
                                    const options = [{value: '', text: 'All stores'}]
                                    props.storeInv.stores.forEach(store => {
                                        options.push({value: store.id, text: store.name})
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
                <Button size={'sm'} text={'Search'} attr={{
                        disabled: disableBtn,
                        onClick: () => {getStoreInvs()}
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
    </>)
}

const filterReducer = (state, action) => {
    const payload = action.payload
    switch(action.type){
        case 'update': 
            if(payload.key === 'limit' || payload.key === 'store_id'){ 
                payload.value = parseInt(payload.value)
            }
            return {...state, [payload.key]: payload.value}

        case 'reset': return payload

        default: throw new Error();
    }
}

const GenerateStoreInv = ({storeInvs, editStoreInv}) => {
    return (<>
        <div className="inventories-container">
            <Table
                headings={['Inventory', 'Store', 'Total Stored', 'Actions']}
                body={storeInvs.map((storeInv, index) => [
                    storeInv.inventory.name, storeInv.store.name, 
                    storeInv.total_amount ? formatNum(storeInv.total_amount) : 0,
                    <>
                        <Button text={'View'} size={'sm'} 
                            attr={{onClick: () => {editStoreInv(index)}}}
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