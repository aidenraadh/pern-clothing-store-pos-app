import {useReducer, useState} from 'react'
import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal} from '../Windows'
import Table from '../Table'
import {SVGIcons} from '../Misc'

function InventoryPage(props){
    const [invIndex, setInvIndex] = useState('')
    const [invId, setInvId] = useState('')
    const [invName, setInvName] = useState('')
    const [invSizes, dispatchInvSizes] = useReducer(sizesReducer, [])
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)

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
    if(!props.inventory.inventories){
        // Get the resource
        getInventories(props.dispatchInventory)
        // Return loading UI
        return 'Loading...'
    }
    return (<>
        <section className='flex-row content-end items-center' style={{marginBottom: '2rem'}}>
            <Button text={'+ Create'} type={'primary'} size={'sm'} attr={{onClick: createInventory}}/>
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
                                        dispatchInvSizes({
                                            type: 'update', payload: {
                                                index: index, key: 'name', 
                                                value: e.target.value
                                            }
                                        })
                                    }
                                }} 
                            />,
                            <TextInput size={'sm'} formAttr={{
                                    value: formatNum(size.production_price), 
                                    onChange: (e) => {
                                        dispatchInvSizes({
                                            type: 'update', payload: {
                                                index: index, key: 'production_price', 
                                                value: formatNum(e.target.value, true)
                                            }
                                        })
                                    }
                                }} 
                            />,
                            <TextInput size={'sm'} formAttr={{
                                    value: formatNum(size.selling_price), onChange: (e) => {
                                        dispatchInvSizes({
                                            type: 'update', payload: {
                                                index: index, key: 'selling_price', 
                                                value: formatNum(e.target.value, true)
                                            }
                                        })
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
                        onClick: () => {
                            invIndex && invId ? 
                            updateInventory(props.dispatchInventory, invIndex, invId, invName, invSizes) :
                            storeInventory(props.dispatchInventory, invName, invSizes)
                        }
                    }}
                />                
            }
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
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

const getInventories = (dispatchInventory, actionType = '', filters = {offset: 0}) => {
    filters = {...getResFilters(INVENTORY_FILTER_KEY), ...filters}

    api.get(`/inventories${getQueryString(filters)}`)
       .then(response => {
           dispatchInventory({type: actionType, payload: response.data})
       })
       .catch(err => errorHandler(err))
}

const storeInventory = (dispatchInventory, name, sizes) => {
    console.log(name)
    console.log(sizes)    
    // api.post('/inventories', {
    //         name: name, sizes: sizes
    //     })
    //    .then(response => {
    //        dispatchInventory({
    //            type: INVENTORY_ACTIONS.PREPEND, 
    //            payload: {inventories: response.data.inventory}
    //         })
    //    })
    //    .catch(err => errorHandler(err))
}

const updateInventory = (dispatchInventory, index, id, name, sizes) => {
    console.log(id)
    console.log(name)
    console.log(sizes)
    // api.put(`/inventories/${id}`, {
    //         name: name, sizes: sizes
    //     })
    //    .then(response => {
    //        dispatchInventory({
    //            type: INVENTORY_ACTIONS.PREPEND, 
    //            payload: {inventories: response.data.inventory}
    //         })
    //    })
    //    .catch(err => errorHandler(err))
}

export default InventoryPage