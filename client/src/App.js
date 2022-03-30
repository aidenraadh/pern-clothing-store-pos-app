import {useState, useReducer} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import {inventoryReducer, INVENTORY_INIT_STATE} from "./components/reducers/InventoryReducer";
import {storeReducer, STORE_INIT_STATE} from "./components/reducers/StoreReducer";
import {storeInventoryReducer, STOREINV_INIT_STATE} from "./components/reducers/StoreInventoryReducer";

import LoginPage from './components/pages/LoginPage'
import DashboardPage from './components/pages/DashboardPage'
import InventoryPage from './components/pages/InventoryPage'
import StorePage from './components/pages/StorePage'
import IndexStoreInventoryPage from './components/pages/store_inventory/IndexStoreInventoryPage'
import CreateStoreInventoryPage from './components/pages/store_inventory/CreateStoreInventoryPage'
import NotFoundPage from './components/pages/NotFoundPage'

import './css/content.css';
import './css/components.css';
import './css/layouts.css';
import './css/utilities.css';
import './css/media-queries.css';
import './css/custom.css';

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const [inventory, dispatchInventory] = useReducer(inventoryReducer, INVENTORY_INIT_STATE)
    const [store, dispatchStore] = useReducer(storeReducer, STORE_INIT_STATE)
    const [storeInv, dispatchStoreInv] = useReducer(storeInventoryReducer, STOREINV_INIT_STATE)

    const user = getUser()

    return (
        <ErrorBoundary>
            <Router>
                {(
                    isAuth() ?
                    <Navigations
                        sidebarShown={sidebarShown}
                        toggleSidebar={() => {setSidebarShown(state => !state)}}
                        rightWidgets={[
                            <UserThumbnail userName={user.name} />
                        ]}
                        sidebarItems={(() => {
                            let sidebarItems = [
                                {
                                    icon: 'layers', text: 'Dashboard', link: ''
                                },	            
                                {
                                    icon: 'layers', text: 'Store Inventories', link: 'store-inventories'
                                },	             
                            ]
                            if(user.role.name.toLowerCase() === 'owner'){
                                sidebarItems.splice(1, 0,
                                    {
                                        icon: 'hanger', text: 'Inventory', link: 'inventories'
                                    },	   
                                    {
                                        icon: 'layers', text: 'Store', link: 'stores'
                                    },	            
                                )
                            }
                            return sidebarItems                            
                        })()}	
                    /> : ''       
                )}
                <div id="app">
                    <Switch>                  
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={DashboardPage}/>
                        <ProtectedRoute path={'/inventories'} exact component={InventoryPage}
                            inventory={inventory} dispatchInventory={dispatchInventory}
                        />
                        <ProtectedRoute path={'/stores'} exact component={StorePage}
                            store={store} dispatchStore={dispatchStore}
                        />     
                        <ProtectedRoute path={'/store-inventories'} exact component={IndexStoreInventoryPage}
                            storeInv={storeInv} dispatchStoreInv={dispatchStoreInv}
                        />        
                        <ProtectedRoute path={'/store-inventories/create'} exact component={CreateStoreInventoryPage}
                            storeInv={storeInv} dispatchStoreInv={dispatchStoreInv}
                        />                                                                   
                        
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}

export default App