import {INVENTORY_ACTIONS, INVENTORY_FILTER_KEY} from '../reducers/InventoryReducer'

import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'


const getInventories = (dispatchInventory, actionType = '', filters = {offset: 0}) => {
    filters = {...getResFilters(INVENTORY_FILTER_KEY), ...filters}

    api.get(`/inventories${getQueryString(filters)}`)
       .then(response => {
           dispatchInventory({type: actionType, payload: response.data})
       })
       .catch(err => errorHandler(err))
}

function InventoryPage(props){
    // When the inventory resource is not set yet
    if(!props.inventory.inventories){
        // Get the resource
        getInventories(props.dispatchInventory)
        // Return loading UI
        return 'Loading...'
    }
    return (<>
        <PlainCard
            body={<Table 
                headings={['Name']}
                body={props.inventory.inventories.map(inventory => (
                    [inventory.name]
                ))}
            />}
        />
    </>)
}

export default InventoryPage