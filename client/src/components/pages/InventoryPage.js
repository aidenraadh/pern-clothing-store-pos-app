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
    const apiCallbacks = {
        before: () => {
            setDisableBtn(true)
        },
        after: (response) => {
            if(response.status == 200){
                setModalShown(false)
                // setFilterModalShown(false)
            }
            // Bad input
            else if(response.status == 400){
                alert(response.data.message)
            }
            setDisableBtn(false)
        }
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
            <Button text={'Filter'} size={'sm'} iconName={'sort_1'} attr={{onClick: () => {setFilterModalShown(true)}}} />
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
                        onClick: async () => {
                            const response = await (
                                invIndex !== '' && invId !== '' ? 
                                updateInventory(invIndex, invId, invName, invSizes, props.dispatchInventory, apiCallbacks) :
                                storeInventory(props.dispatchInventory, {name: invName, sizes: invSizes})
                            )
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
                        onClick: async () => {
                            setDisableBtn(true)
                            const response = await getInventories(props.dispatchInventory, {limit: limit})
                            if(response.status == 200){ setFilterModalShown(false) }
                            setDisableBtn(false)
                        }
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

const getInventories = async (dispatchInventory, filters = {}, actionType = '') => {
    // Merged the applied filters with new filters
    filters = {...getResFilters(INVENTORY_FILTER_KEY), ...filters}
    // When the inventory is refreshed, set the offset to 0
    if(actionType === ''){
        filters.offset = 0
    }
    const response = await api.get(`/inventories${getQueryString(filters)}`)
  
    if(response.status && response.status == 200){
        dispatchInventory({type: actionType, payload: response.data})
        return response
    }
    else{
        return response.response
    }
}

const storeInventory = async (dispatchInventory, reqBody) => { 
    const response = await api.post('/inventories', {
        name: reqBody.name, inventory_sizes: JSON.stringify(reqBody.sizes)
    })
    if(response.status && response.status == 200){
        dispatchInventory({
            type: INVENTORY_ACTIONS.PREPEND, 
            payload: {inventories: response.data.inventory}
        })
        return response
    }
    else{
        return response.response
    }       
}

const updateInventory = async (dispatchInventory, reqBody, index, id) => {
    const response = await api.put(`/inventories/${id}`, {
        name: reqBody.name, inventory_sizes: JSON.stringify(reqBody.sizes)
    })
    if(response.status && response.status == 200){
        dispatchInventory({
            type: INVENTORY_ACTIONS.REPLACE, 
            payload: {inventory: response.data.inventory, index: index}
        })
        return response
    }
    else{
        return response.response
    }           
}

export default InventoryPage