import {useReducer, useState, useEffect, useCallback} from 'react'
import {ACTIONS, filterReducer, getFilters} from '../reducers/InventoryReducer'
import {api, errorHandler, getQueryString, formatNum, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'
import {Grid} from '../Layouts'
import SVGIcons from '../SVGIcons'

function InventoryPage({inventory, dispatchInventory, user, loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit inventory */
    const [invIndex, setInvIndex] = useState('')
    const [invId, setInvId] = useState('')
    const [invName, setInvName] = useState('')
    const [invSizes, dispatchInvSizes] = useReducer(sizesReducer, [])
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Filters */
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters(inventory.isLoaded))
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Delete inventory */
    const [popupShown, setPopupShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')      


    const getInventories = useCallback((actionType = '') => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)

        if(inventory.isLoaded){
            setDisableBtn(true)
        }
        api.get(`/inventories${getQueryString(queries)}`)
           .then(response => {
                if(inventory.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                         
                dispatchInventory({type: actionType, payload: response.data})
                dispatchFilters({type: ACTIONS.FILTERS.RESET, payload: {
                    filters: response.data.filters
                }})
           })
           .catch(error => {
                if(inventory.isLoaded){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }, [inventory, filters, dispatchInventory]) 

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
            dispatchInventory({
                type: ACTIONS.PREPEND, 
                payload: {inventories: response.data.inventory}
            })
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                
            }})           
        })           
    }, [invName, invSizes, dispatchInventory])  

    const editInventory = useCallback((index, id, name, sizes) => {
        setInvIndex(index)
        setInvId(id)
        setInvName(name)
        dispatchInvSizes({payload: sizes})
        setModalHeading(`Edit ${name}`)
        setModalShown(true)
    }, [])

    const updateInventory = useCallback(() => {
        setDisableBtn(true)   
        api.put(`/inventories/${invId}`, {
            name: invName, inventory_sizes: JSON.stringify(invSizes)
        })     
        .then(response => {
            dispatchInventory({
                type: ACTIONS.REPLACE, 
                payload: {inventory: response.data.inventory, index: invIndex}
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
    }, [invId, invIndex, invName, invSizes, dispatchInventory]) 

    const confirmDeleteInventory = useCallback((id, index) => {
        setInvId(id)
        setInvIndex(index)
        setPopupShown(true)
    }, [])

    const deleteInventory = useCallback(() => {
        api.delete(`/inventories/${invId}`)     
           .then(response => {        
               dispatchInventory({
                   type: ACTIONS.REMOVE, 
                   payload: {indexes: invIndex}
               })                
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
    }, [invId, invIndex, dispatchInventory])

    useEffect(() => {
        if(inventory.isLoaded === false){ 
            getInventories(ACTIONS.RESET)
        }
    }, [inventory, getInventories])    
   

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
                            formAttr={{value: filters.name, placeholder: loc.searchInventory, 
                                onChange: (e) => {dispatchFilters({type: ACTIONS.FILTERS.UPDATE, payload: {
                                    key: 'name', value: e.target.value
                                }})},
                                onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getInventories(ACTIONS.RESET)})}   
                            }} 
                        />   
                        <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                                style: {flexShrink: '0'},
                                onClick: () => {getInventories(ACTIONS.RESET)}
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
                        canLoadMore={inventory.canLoadMore}
                        action={() => {getInventories(ACTIONS.APPEND)}}
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
                                                value: formatNum(e.target.value, true)
                                            }})
                                        }
                                    }} 
                                />,
                                <TextInput size={'md'} formAttr={{
                                        value: formatNum(size.selling_price), pattern: '[0-9]*',
                                        onChange: (e) => {
                                            dispatchInvSizes({type: 'update', payload: {
                                                index: index, key: 'selling_price', 
                                                value: formatNum(e.target.value, true)
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
                            value: filters.limit,
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'limit', value: e.target.value}
                            })}                        
                        }}
                        options={[
                            {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                        ]}
                    />,
                    <Select label={loc.showsOnly}
                        formAttr={{
                            value: filters.shows_only,
                            onChange: e => {dispatchFilters({
                                type: ACTIONS.FILTERS.UPDATE, payload: {key: 'shows_only', value: e.target.value}
                            })}                        
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
                        onClick: () => {getInventories(ACTIONS.RESET)}
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
    switch(action.type){
        case 'add': return [
                ...state, {name: '', production_price: '', selling_price: ''}
            ]; 
        case 'remove': return (() => {
                let sizes = [...state]
                sizes.splice(action.payload.index, 1)
                return sizes
            })()
        case 'update': return (() => {
                let sizes = [...state]
                for(const key in sizes[action.payload.index]){
                    if(key === action.payload.key){
                        sizes[action.payload.index][key] = action.payload.value
                    }
                }
                return sizes
            })()
        default: return action.payload;
    }
}

const InventoryList = ({loc, inventories, editInventory, confirmDeleteInventory}) => {
    return (
        <Table
            headings={['No', 'Name', 'Actions']}
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

const LoadMoreBtn = ({canLoadMore, action}) => {
    return (
        canLoadMore ? 
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
        onClick={action}>
            Load More
        </button> : ''        
    )
}

export default InventoryPage