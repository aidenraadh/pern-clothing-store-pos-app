import {useReducer, useState, useRef} from 'react'
import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput, Select} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal} from '../Windows'
import Table from '../Table'
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
    /* Filter inventory */
    const initFilters = useRef(getResFilters(INVENTORY_FILTER_KEY))
    const [limit, setLimit] = useState(initFilters.current.limit ? initFilters.current.limit : 10)
    const [filterModalShown, setFilterModalShown] = useState(false)

    const createInventory = () => {
        setInvIndex('')
        setInvId('')
        setInvName('')
        dispatchInvSizes({payload: []})
        setModalHeading('Create New Inventory')      
        setModalShown(true)
    } 
    const editInventory = (index, id, name, sizes) => {
        setInvIndex(index)
        setInvId(id)
        setInvName(name)
        dispatchInvSizes({payload: sizes})
        setModalHeading(`Edit ${name}`)
        setModalShown(true)
    }        
    // When the inventory resource is not set yet
    if(props.inventory.inventories === null){
        // Get the resource
        getInventories(props.dispatchInventory)
        // Return loading UI
        return 'Loading...'
    }
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{
                onClick: () => {setFilterModalShown(true)},
                style: {marginRight: '1rem'}
            }} />
            <Button text={'+ Create'} size={'sm'} attr={{onClick: createInventory}}/>
        </section>
        <PlainCard
            body={<>
                <GenerateInventories 
                    inventories={props.inventory.inventories} 
                    editInventory={editInventory}
                />
            </>}
        />
        <Modal
            heading={modalHeading}
            body={<>
                <TextInput size={'sm'} label={'Name'}
                    formAttr={{value: invName, onChange: (e) => {setInvName(e.target.value)}}}
                />
                <Table
                    headings={['', 'Size', 'Production Price', 'Selling Price']}
                    body={invSizes.map((size, index) => (
                        [
                            <button type="button" onClick={() => {dispatchInvSizes({type: 'remove', payload: {index: index}})}}>
                                <SVGIcons name={'close'} color={'red'} attr={{style: {fontSize: '1.8rem'}}}/>
                            </button>,
                            <TextInput size={'sm'} formAttr={{
                                    value: size.name, onChange: (e) => {
                                        dispatchInvSizes({type: 'update', payload: {
                                            index: index, key: 'name', 
                                            value: e.target.value
                                        }})
                                    }
                                }} 
                            />,
                            <TextInput size={'sm'} formAttr={{
                                    value: formatNum(size.production_price), 
                                    onChange: (e) => {
                                        dispatchInvSizes({type: 'update', payload: {
                                            index: index, key: 'production_price', 
                                            value: formatNum(e.target.value, true)
                                        }})
                                    }
                                }} 
                            />,
                            <TextInput size={'sm'} formAttr={{
                                    value: formatNum(size.selling_price), onChange: (e) => {
                                        dispatchInvSizes({type: 'update', payload: {
                                            index: index, key: 'selling_price', 
                                            value: formatNum(e.target.value, true)
                                        }})
                                    }
                                }} 
                            />,
                        ]
                    ))}
                />
                <button type="button" className="text-blue block" style={{margin: '1rem auto 0'}} 
                onClick={() => {dispatchInvSizes({type: 'add'})}}>
                    + New Size
                </button>         
            </>}        
            footer={
                <Button size={'sm'} text={'Save Changes'} attr={{
                    disabled: disableBtn,
                        onClick: () => {invIndex !== '' && invId !== '' ? 
                            updateInventory(
                                props.dispatchInventory, {name: invName, inventory_sizes: invSizes}, 
                                invId, invIndex, {
                                before: () => {setDisableBtn(true)},
                                success: () => {
                                    setDisableBtn(false)
                                    setModalShown(false)
                                },
                                failed: (error) => {
                                    setDisableBtn(false)
                                    errorHandler(error, {'400': () => {alert(error.response.data.message)}})
                                }                                    
                            }) : 
                            storeInventory(
                                props.dispatchInventory, {name: invName, inventory_sizes: invSizes}, {
                                before: () => {setDisableBtn(true)},
                                success: () => {
                                    setDisableBtn(false)
                                    setModalShown(false)
                                },
                                failed: (error) => {
                                    setDisableBtn(false)
                                    errorHandler(error, {'400': () => {alert(error.response.data.message)}})
                                }
                            })
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
                    formAttr={{value: limit, onChange: e => {setLimit(parseInt(e.target.value))}}}
                    options={[
                        {value: 10, text: 10}, {value: 20, text: 20}, {value: 30, text: 30}
                    ]}
                />
            </>}        
            footer={
                <Button size={'sm'} text={'Search'} attr={{
                        disabled: disableBtn,
                        onClick: () => {getInventories(
                            props.dispatchInventory, {limit: limit},
                            {
                                before: () => {setDisableBtn(true)},
                                success: () => {
                                    setDisableBtn(false)
                                    setFilterModalShown(false)
                                },
                                failed: (error) => {
                                    setDisableBtn(false)
                                    setFilterModalShown(false)
                                }                                
                            }
                        )}
                    }}
                />                
            }
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
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

const GenerateInventories = ({inventories, editInventory}) => {
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
                        />                        
                    </span>             
                </div>
            ))}
        </div>    
    </>)
}

const getInventories = (dispatchInventory, filters = {}, callbacks = {}, actionType = '') => {
    // Merged the applied filters with new filters
    filters = {
        ...getResFilters(INVENTORY_FILTER_KEY), ...filters
    }
    // When the inventory is refreshed, set the offset to 0
    if(actionType === ''){
        filters.offset = 0
    }
    if(callbacks.before){
        callbacks.before()
    }
    api.get(`/inventories${getQueryString(filters)}`)
       .then(response => {
            if(callbacks.success){
                callbacks.success()
            }               
            dispatchInventory({type: actionType, payload: response.data})
       })
       .catch(error => {
            if(callbacks.failed){
                callbacks.failed(error)
            }   
            errorHandler(error) 
       })
}

const storeInventory = (dispatchInventory, reqBody, callbacks) => {
    if(callbacks.before){
        callbacks.before()
    }    
    api.post('/inventories', {
        ...reqBody, inventory_sizes: JSON.stringify(reqBody.inventory_sizes)
    })
    .then(response => {
        if(callbacks.success){
            callbacks.success()
        }           
        dispatchInventory({
            type: INVENTORY_ACTIONS.PREPEND, 
            payload: {inventories: response.data.inventory}
        })
    })
    .catch(error => {
        if(callbacks.failed){
            callbacks.failed(error)
        }             
    })           
}

const updateInventory = (dispatchInventory, reqBody, id, index, callbacks) => {
    if(callbacks.before){
        callbacks.before()
    }     
    api.put(`/inventories/${id}`, {
        ...reqBody, inventory_sizes: JSON.stringify(reqBody.inventory_sizes)
    })     
    .then(response => {
        if(callbacks.success){
            callbacks.success()
        }           
        dispatchInventory({
            type: INVENTORY_ACTIONS.REPLACE, 
            payload: {inventory: response.data.inventory, index: index}
        })                
    })
    .catch(error => {
        if(callbacks.failed){
            callbacks.failed(error)
        }             
    })        
} 

export default InventoryPage