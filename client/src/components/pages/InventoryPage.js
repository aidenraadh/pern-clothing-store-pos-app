import {useReducer, useState, useEffect} from 'react'
import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum, keyHandler} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import Table from '../Table'
import {Grid} from '../Layouts'
import {SVGIcons} from '../Misc'

function InventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    /* Create/edit inventory */
    const [invIndex, setInvIndex] = useState('')
    const [invId, setInvId] = useState('')
    const [invName, setInvName] = useState('')
    const [invSizes, dispatchInvSizes] = useReducer(sizesReducer, [])
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    /* Delete inventory */
    const [popupShown, setPopupShown] = useState(false)
    /* Filter inventory */
    const initFilters = getResFilters(INVENTORY_FILTER_KEY)
    const [filters, setFilters] = useState({
        name: initFilters.name ? initFilters.name : '',
        limit: initFilters.limit ? initFilters.limit : 10, 
        offset: initFilters.offset ? initFilters.offset : 0, 
    })
    const [filterModalShown, setFilterModalShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')

    useEffect(() => {
        if(props.inventory.inventories === null){
            getInventories()
        }
    }, [])
    const getInventories = (actionType = '') => {
        // Get the queries
        const queries = {...filters}
        // When the inventory is refreshed, set the offset to 0
        queries.offset = actionType === '' ? 0 : (queries.offset + queries.limit)

        if(props.inventory.inventories !== null){
            setDisableBtn(true)
        }
        api.get(`/inventories${getQueryString(queries)}`)
           .then(response => {
                if(props.inventory.inventories !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }                          
                props.dispatchInventory({type: actionType, payload: response.data})
                setFilters(getResFilters(INVENTORY_FILTER_KEY))
           })
           .catch(error => {
                if(props.inventory.inventories !== null){
                    setDisableBtn(false)
                    setFilterModalShown(false)
                }   
                errorHandler(error) 
           })
    }    
    const createInventory = () => {
        setInvIndex('')
        setInvId('')
        setInvName('')
        dispatchInvSizes({payload: []})
        setModalHeading('Create New Inventory')      
        setModalShown(true)
    } 
    const storeInventory = () => {
        setDisableBtn(true)
        api.post('/inventories', {
            name: invName, inventory_sizes: JSON.stringify(invSizes)
        })
        .then(response => {
            setDisableBtn(false)
            setModalShown(false)           
            props.dispatchInventory({
                type: INVENTORY_ACTIONS.PREPEND, 
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
    }    
    const editInventory = (index, id, name, sizes) => {
        setInvIndex(index)
        setInvId(id)
        setInvName(name)
        dispatchInvSizes({payload: sizes})
        setModalHeading(`Edit ${name}`)
        setModalShown(true)
    }    
    const updateInventory = () => {
        setDisableBtn(true)   
        api.put(`/inventories/${invId}`, {
            name: invName, inventory_sizes: JSON.stringify(invSizes)
        })     
        .then(response => {
            setDisableBtn(false)
            setModalShown(false)            
            props.dispatchInventory({
                type: INVENTORY_ACTIONS.REPLACE, 
                payload: {inventory: response.data.inventory, index: invIndex}
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
    const confirmDeleteInventory = (id, index) => {
        setInvId(id)
        setInvIndex(index)
        setPopupShown(true)
    }   
    const deleteInventory = () => {
        api.delete(`/inventories/${invId}`)     
           .then(response => {        
               props.dispatchInventory({
                   type: INVENTORY_ACTIONS.REMOVE, 
                   payload: {indexes: invIndex}
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
    // When the inventory resource is not set yet
    // Return loading UI
    if(props.inventory.inventories === null){
        return 'Loading...'
    }    
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={'+ New'} size={'sm'} attr={{onClick: createInventory}}/>
        </section>
        <PlainCard
            body={
                <Grid num_of_columns={1} items={[
                    <div className='flex-row items-center'>
                        <TextInput size={'md'} containerAttr={{style: {width: '100%', marginRight: '1.2rem'}}} 
                            iconName={'search'}
                            formAttr={{value: filters.name, placeholder: 'Search inventory', 
                                onChange: (e) => {
                                    setFilters(state => ({...state, name: e.target.value}))
                                },
                                onKeyUp: (e) => {keyHandler(e, 'Enter', getInventories)}
                            }} 
                        />   
                        <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                                style: {flexShrink: '0'},
                                onClick: () => {getInventories()}
                            }}
                        />                                       
                    </div>,
                    <GenerateInventories 
                        inventories={props.inventory.inventories} 
                        editInventory={editInventory}
                        confirmDeleteInventory={confirmDeleteInventory}
                    />,
                    <LoadMoreBtn 
                        canLoadMore={props.inventory.canLoadMore}
                        action={() => {getInventories(INVENTORY_ACTIONS.APPEND)}}
                    />                                  
                ]}/>
            }
        />
        <Modal
            heading={modalHeading}
            body={<>
                <Grid num_of_columns={1} items={[
                    <TextInput size={'md'} label={'Name'}
                        formAttr={{value: invName, onChange: (e) => {setInvName(e.target.value)}}}
                    />,
                    <Table
                        headings={['', 'Size', 'Production Price', 'Selling Price']}
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
                        + New Size
                    </button>                                      
                ]}/>        
            </>}        
            footer={
                <Button size={'sm'} text={'Save Changes'} attr={{
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
            body={<>
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
                        onClick: () => {getInventories()}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this inventory?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
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

const GenerateInventories = ({inventories, editInventory, confirmDeleteInventory}) => {
    return (<>
        <div className="inventories-container">
            {inventories.map((inventory, key) => (
                <div className="inventory flex-row items-center content-space-between" key={key}>
                    <span className="name">{inventory.name}</span>          
                    <span className="actions">
                        <Button 
                            size={'sm'} type={'light'} text={'View'}
                            attr={{onClick: () => {
                                    editInventory(key, inventory.id, inventory.name, inventory.sizes)
                                }
                            }}
                        />
                        <Button 
                            size={'sm'} type={'light'} text={'Delete'} color={'red'}
                            attr={{onClick: () => {
                                    confirmDeleteInventory(inventory.id, key)
                                }
                            }}                            
                        />                        
                    </span>             
                </div>
            ))}
        </div>    
    </>)
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