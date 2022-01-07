import {useReducer, useState} from 'react'
import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, numToPrice} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal} from '../Windows'
import Table from '../Table'

function InventoryPage(props){
    const [invId, setInvId] = useState('')
    const [invName, setInvName] = useState('')
    const [invSizes, dispatchInvSizes] = useReducer(sizesReducer, [])
    const [modalHeading, setModalHeading] = useState('')
    const [modalShown, setModalShown] = useState(false)
    // When the inventory resource is not set yet
    if(!props.inventory.inventories){
        // Get the resource
        getInventories(props.dispatchInventory)
        // Return loading UI
        return 'Loading...'
    }
    return (<>
        <PlainCard
            body={<>
                <div className="inventories-container">
                    {props.inventory.inventories.map((inventory, key) => (
                        <div className="inventory flex-row items-center content-space-between" key={key}>
                            <span className="name">{inventory.name}</span>          
                            <span className="actions">
                                <Button 
                                    size={'sm'} type={'light'} text={'View'}
                                    attr={{onClick: () => {
                                            setInvId(inventory.id)
                                            setInvName(inventory.name)
                                            dispatchInvSizes({payload: inventory.sizes})
                                            setModalHeading(`Edit ${inventory.name}`)
                                            setModalShown(true)
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
            </>}
        />
        <Modal
            heading={modalHeading}
            body={<>
                <h6>Name</h6>
                <TextInput size={'sm'}
                    formAttr={{value: invName, onChange: (e) => {setInvName(e.target.value)}}}
                />
                <h6>Sizes</h6>
                <Table
                    headings={['Size', 'Production Price', 'Selling Price']}
                    body={invSizes.map((size, index) => (
                        [
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
                                    value: size.production_price, onChange: (e) => {
                                        dispatchInvSizes({
                                            type: 'update', payload: {
                                                index: index, key: 'production_price', 
                                                value: e.target.value
                                            }
                                        })
                                    }
                                }} 
                            />,
                            <TextInput size={'sm'} formAttr={{
                                    value: size.selling_price, onChange: (e) => {
                                        dispatchInvSizes({
                                            type: 'update', payload: {
                                                index: index, key: 'selling_price', 
                                                value: e.target.value
                                            }
                                        })
                                    }
                                }} 
                            />,
                        ]
                    ))}
                />                
            </>}        
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


const getInventories = (dispatchInventory, actionType = '', filters = {offset: 0}) => {
    filters = {...getResFilters(INVENTORY_FILTER_KEY), ...filters}

    api.get(`/inventories${getQueryString(filters)}`)
       .then(response => {
           dispatchInventory({type: actionType, payload: response.data})
       })
       .catch(err => errorHandler(err))
}

// const updateInventory = (id, name, sizes) => {
//     api.get(`/inventories/${id}`)
//        .then(response => {
//            dispatchInventory({type: INVENTORY_ACTIONS.REPLACE, payload: response.data})
//        })
//        .catch(err => errorHandler(err))    
// }

export default InventoryPage