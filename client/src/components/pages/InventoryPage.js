import {useReducer, useState, useEffect, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/inventorySlice'
import {api, errorHandler, getQueryString, formatNum, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'
import {Grid} from '../Layouts'
import SVGIcons from '../SVGIcons'

function InventoryPage({user, loc}){
    const inventory = useSelector(state => state.inventory)
    const dispatch = useDispatch()    
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit inventory */
    const [invIndex, setInvIndex] = useState('')
    const [invId, setInvId] = useState('')
    const [invName, setInvName] = useState('')
    const [invSizes, dispatchInvSizes] = useReducer(sizesReducer, [])
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Filters */
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Delete inventory */
    const [popupShown, setPopupShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')      

    const getInventories = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...inventory.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...inventory.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/inventories${getQueryString(queries)}`)
           .then(response => {
                const responseData = response.data
                setDisableBtn(false)
                setFilterModalShown(false)                      
                dispatch(actionType({
                    inventories: responseData.inventories,
                    filters: responseData.filters
                }))                
           })
           .catch(error => {
                setDisableBtn(false)
                setFilterModalShown(false)               
                errorHandler(error) 
           })
    }, [inventory, dispatch]) 

    const createInventory = useCallback(() => {
        setInvIndex('')
        setInvId('')
        setInvName('')
        dispatchInvSizes({payload: []})
        setModalHeading('Create New Inventory')      
        setModalShown(true)
    }, [])

    const storeInventory = useCallback(() => {
        setDisableBtn(true)
        api.post('/inventories', {
            name: invName, inventory_sizes: JSON.stringify(invSizes)
        })
        .then(response => {
            setDisableBtn(false)
            setModalShown(false)           
            dispatch(prepend({
                inventories: response.data.inventory
            })) 
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                
            }})           
        })           
    }, [invName, invSizes, dispatch])  

    const editInventory = useCallback((index, id, name, sizes) => {
        setInvIndex(index)
        setInvId(id)
        setInvName(name)
        dispatchInvSizes({payload: {sizes: sizes}})
        setModalHeading(loc.editInv)
        setModalShown(true)
    }, [loc.editInv])

    const updateInventory = useCallback(() => {
        setDisableBtn(true)   
        api.put(`/inventories/${invId}`, {
            name: invName, inventory_sizes: JSON.stringify(invSizes)
        })     
        .then(response => {
            dispatch(replace({
                inventory: response.data.inventory,
                index: invIndex
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
    }, [invId, invIndex, invName, invSizes, dispatch]) 

    const confirmDeleteInventory = useCallback((id, index) => {
        setInvId(id)
        setInvIndex(index)
        setPopupShown(true)
    }, [])

    const deleteInventory = useCallback(() => {
        api.delete(`/inventories/${invId}`)     
           .then(response => {        
                dispatch(remove({
                    indexes: invIndex
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
    }, [invId, invIndex, dispatch])

    useEffect(() => {
        if(inventory.isLoaded === false){ 
            getInventories(reset)
        }
    }, [inventory, getInventories])    

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])      

    useEffect(() => {
        // console.log(invSizes)
    }, [invSizes])
   

    // When the inventory resource is not set yet
    // Return loading UI
    if(inventory.isLoaded === false){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={`+ ${loc['new']}`} size={'sm'} attr={{onClick: createInventory}}/>
        </section>
        <PlainCard
            body={
                <Grid numOfColumns={1} items={[
                    <div className='flex-row items-center'>
                        <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                            iconName={'search'}
                            formAttr={{value: inventory.filters.name, placeholder: loc.searchInventory, 
                                onChange: (e) => {dispatch(updateFilters([
                                    {key: 'name', value: e.target.value}
                                ]))},
                                onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getInventories(reset)})}   
                            }} 
                        />   
                        <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                                style: {flexShrink: '0'},
                                onClick: () => {getInventories(reset)}
                            }}
                        />                                       
                    </div>,
                    <InventoryList 
                        loc={loc}
                        inventories={inventory.inventories} 
                        editInventory={editInventory}
                        confirmDeleteInventory={confirmDeleteInventory}
                    />,
                    <LoadMoreBtn 
                        disableBtn={disableBtn}
                        canLoadMore={inventory.canLoadMore}
                        action={() => {getInventories(append)}}
                    />                                  
                ]}/>
            }
        />
        <Modal
            heading={modalHeading}
            body={<>
                <Grid numOfColumns={1} items={[
                    <TextInput size={'md'} label={loc.name}
                        formAttr={{value: invName, onChange: (e) => {setInvName(e.target.value)}}}
                    />,
                    <Table
                        headings={['', loc.size, loc.productionPrice, loc.sellingPrice]}
                        body={invSizes.map((size, index) => (
                            [
                                <button type="button" onClick={() => {dispatchInvSizes({type: 'remove', payload: {index: index}})}}>
                                    <SVGIcons name={'close'} color={'red'} attr={{style: {fontSize: '1.8rem'}}}/>
                                </button>,
                                <TextInput size={'md'} formAttr={{
                                        value: size.name, onChange: (e) => {
                                            dispatchInvSizes({type: 'update', payload: {
                                                index: index, key: 'name', 
                                                value: e.target.value
                                            }})
                                        }
                                    }} 
                                />,
                                <TextInput size={'md'} formAttr={{
                                        value: formatNum(size.production_price), pattern: '[0-9]*', 
                                        onChange: (e) => {
                                            dispatchInvSizes({type: 'update', payload: {
                                                index: index, key: 'production_price', 
                                                value: e.target.value
                                            }})
                                        }
                                    }} 
                                />,
                                <TextInput size={'md'} formAttr={{
                                        value: formatNum(size.selling_price), pattern: '[0-9]*',
                                        onChange: (e) => {
                                            dispatchInvSizes({type: 'update', payload: {
                                                index: index, key: 'selling_price', 
                                                value: e.target.value
                                            }})
                                        }
                                    }} 
                                />,
                            ]
                        ))}
                    />,
                    <button type="button" className="text-blue block" style={{margin: '0 auto'}} 
                    onClick={() => {dispatchInvSizes({type: 'add'})}}>
                        + {loc.newSize}
                    </button>                                      
                ]}/>        
            </>}        
            footer={
                <Button size={'sm'} text={loc.saveChanges} attr={{
                        disabled: disableBtn,
                        onClick: () => {
                            invIndex !== '' && invId !== '' ? 
                            updateInventory() : storeInventory()
                        }
                    }}
                />                
            }
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />
        <Modal
            heading={'Filter'}
            size={'md'}
            body={
                <Grid numOfColumns={1} items={[
                    <Select label={loc.rowsShown}
                        formAttr={{
                            value: inventory.filters.limit,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'limit', value: e.target.value}
                            ]))}                        
                        }}
                        options={[
                            {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                        ]}
                    />,
                    <Select label={loc.showsOnly}
                        formAttr={{
                            value: inventory.filters.shows_only,
                            onChange: e => {dispatch(updateFilters([
                                {key: 'shows_only', value: e.target.value}
                            ]))}                        
                        }}
                        options={[
                            {value: '', text: loc.showAll},
                            {
                                value: 'empty_production_selling', 
                                text: loc.emptyProductionSelling
                            },
                            {
                                value: 'empty_sizes', 
                                text: loc.emptySizes
                            },                            
                        ]}
                    />,
                ]}/>
            }        
            footer={
                <Button size={'sm'} text={loc.search} attr={{
                        disabled: disableBtn,
                        onClick: () => {getInventories(reset)}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={loc.removeInvWarning}
            confirmText={loc.remove}
            cancelText={loc.cancel}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteInventory}
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

const sizesReducer = (state, action) => {
    const type = action.type
    const payload = {...action.payload}
    switch(type){
        case 'add': return [
                ...state, {name: '', production_price: '', selling_price: ''}
            ]; 
        case 'remove': return (() => {
                let sizes = [...state]
                sizes.splice(payload.index, 1)
                return sizes
            })()
        case 'update': return (() => {
                let sizes = [...state]
                let {index, key, value} = {...payload}
                if(key === 'production_price' || key === 'selling_price'){
                    value = formatNum(value, true)
                }
                sizes[index] = {...sizes[index], [key]: value}
                return sizes
            })()
        default: return payload.sizes;
    }
}

const InventoryList = ({loc, inventories, editInventory, confirmDeleteInventory}) => {
    return (
        <Table
            headings={['No', loc.name, 'Actions']}
            body={inventories.map((inventory, key) => ([
                (key + 1),
                <span className="text-capitalize">{inventory.name}</span>,
                <span>
                    <Button 
                        size={'sm'} type={'light'} text={loc['view']}
                        attr={{
                            style: {marginRight: '1rem'},
                            onClick: () => {
                                editInventory(key, inventory.id, inventory.name, inventory.sizes)
                            }
                        }}
                    />
                    <Button 
                        size={'sm'} type={'light'} text={loc['delete']} color={'red'}
                        attr={{onClick: () => {
                                confirmDeleteInventory(inventory.id, key)
                            }
                        }}                            
                    />                        
                </span>                
            ]))}
        />
    )
}

const LoadMoreBtn = ({canLoadMore, action, disableBtn}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
        onClick={action} disabled={disableBtn}>
            Load More
        </button> : ''        
    )
}

export default InventoryPage