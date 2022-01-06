import {useState} from 'react'
import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, numToPrice} from '../Utils.js'
import {Button} from '../Buttons'
import {TextInput} from '../Forms'
import {PlainCard} from '../Cards'
import {Modal} from '../Windows'
import Table from '../Table'

const getInventories = (dispatchInventory, actionType = '', filters = {offset: 0}) => {
    filters = {...getResFilters(INVENTORY_FILTER_KEY), ...filters}

    api.get(`/inventories${getQueryString(filters)}`)
       .then(response => {
           dispatchInventory({type: actionType, payload: response.data})
       })
       .catch(err => errorHandler(err))
}

const GenerateInventories = ({inventories, setModalHeading, setModalBody, toggleModal}) => {
    const viewInventory = (inventory, setModalBody, toggleModal) => {
        setModalHeading(inventory.name)
        setModalBody(
            <Table
                headings={['Size', 'Production Price', 'Selling Price']}
                body={inventory.sizes.map(size => (
                    [
                        size.name,
                        <TextInput formAttr={{value: size.production_price}} />,
                        <TextInput formAttr={{value: size.selling_price}} />
                    ]
                ))}
            />
        )
        toggleModal(true)
    }
    return (
        <div className="inventories-container">
            {inventories.map((inventory, key) => (
                <div className="inventory flex-row items-center content-space-between" key={key}>
                    <span className="name">{inventory.name}</span>          
                    <span className="actions">
                        <Button 
                            size={'sm'} type={'light'} text={'View'}
                            attr={{onClick: () => {
                                viewInventory(inventory, setModalBody, toggleModal)}
                            }}
                        />
                        <Button 
                            size={'sm'} type={'light'} text={'Delete'} color={'red'}
                        />                        
                    </span>             
                </div>
            ))}
        </div>
    )
}

const sizesReducer = (state, action) => {
    switch(action.type){
        case 'add': return ; break;
    }
}


function InventoryPage(props){
    const [modalHeading, setModalHeading] = useState('')
    const [modalBody, setModalBody] = useState('')
    const [modalShown, toggleModal] = useState(false)
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
                <GenerateInventories 
                    inventories={props.inventory.inventories}
                    toggleModal={toggleModal}
                    setModalHeading={setModalHeading}
                    setModalBody={setModalBody}
                />
            </>}
        />
        <Modal
            heading={modalHeading}
            body={modalBody}        
            shown={modalShown}
            toggleModal={() => {toggleModal(state => !state)}}
        />
    </>)
}

export default InventoryPage