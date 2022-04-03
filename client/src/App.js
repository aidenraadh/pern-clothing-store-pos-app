import {useState, useEffect, useReducer} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import {inventoryReducer, INVENTORY_INIT_STATE} from "./components/reducers/InventoryReducer";
import {storeReducer, STORE_INIT_STATE} from "./components/reducers/StoreReducer";
import {storeInventoryReducer, STOREINV_INIT_STATE} from "./components/reducers/StoreInventoryReducer";
import {storeTransactionReducer, STORETRNSC_INIT_STATE} from "./components/reducers/StoreTransactionReducer";
import {ownerReducer, OWNER_INIT_STATE} from "./components/reducers/OwnerReducer";
import {employeeReducer, EMPLOYEE_INIT_STATE} from "./components/reducers/EmployeeReducer";

import LoginPage from './components/pages/LoginPage'
import DashboardPage from './components/pages/DashboardPage'
import InventoryPage from './components/pages/InventoryPage'
import StorePage from './components/pages/StorePage'
import IndexStoreInventoryPage from './components/pages/store_inventory/IndexStoreInventoryPage'
import CreateStoreInventoryPage from './components/pages/store_inventory/CreateStoreInventoryPage'
import UserPage from './components/pages/UserPage'
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
    const [storeTrnsc, dispatchStoreTrnsc] = useReducer(storeTransactionReducer, STORETRNSC_INIT_STATE)
    const [owner, dispatchOwner] = useReducer(ownerReducer, OWNER_INIT_STATE)
    const [employee, dispatchEmployee] = useReducer(employeeReducer, EMPLOYEE_INIT_STATE)     

    const user = getUser()
    if(user){ user.role.name = user.role.name.toLowerCase() }

    const sidebarItems = {
        dashboard: {
            icon: 'layers', text: 'Dashboard', link: ''
        },     
        inventory: {
            icon: 'hanger', text: 'Inventory', link: 'inventories'
        },
        store: {
            icon: 'ecm004', text: 'Store', link: 'stores'
        },
        store_inventory: {
            icon: 'gen017', text: 'Store Inventories', link: 'store-inventories'
        },
        user: {
            icon: 'group', text: 'Users', link: 'users'
        },         
    }

    return (
        <ErrorBoundary>
            <Router>
                {(
                    isAuth() ?
                    <Navigations
                        sidebarShown={sidebarShown}
                        toggleSidebar={setSidebarShown}
                        rightWidgets={[
                            <UserThumbnail userName={user.name} />
                        ]}
                        sidebarItems={(() => {
                            let sidebarItemNames = []
                            const userRole = user.role.name.toLowerCase()
                            switch(userRole){
                                case 'owner': 
                                    sidebarItemNames = ['dashboard','inventory','store','store_inventory','user'];
                                    break;

                                case 'employee':
                                    sidebarItemNames = ['dashboard','store_inventory'];
                                    break;

                                default: sidebarItemNames = []; break;
                            }
                            return sidebarItemNames.map(name => sidebarItems[name])
                          
                        })()}	
                    /> : ''       
                )}
                <div id="app">
                    <Switch>                  
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact user={user} component={DashboardPage}/>
                        <ProtectedRoute path={'/inventories'} exact component={InventoryPage}
                            user={user} inventory={inventory} dispatchInventory={dispatchInventory}
                        />
                        <ProtectedRoute path={'/stores'} exact component={StorePage}
                            user={user} store={store} dispatchStore={dispatchStore}
                        />     
                        <ProtectedRoute path={'/store-inventories'} exact component={IndexStoreInventoryPage}
                            user={user} storeInv={storeInv} dispatchStoreInv={dispatchStoreInv}
                        />        
                        <ProtectedRoute path={'/store-inventories/create'} exact component={CreateStoreInventoryPage}
                            user={user} storeInv={storeInv} dispatchStoreInv={dispatchStoreInv}
                        /> 
                        <ProtectedRoute path={'/users'} exact component={UserPage}
                            user={user} owner={owner} dispatchOwner={dispatchOwner} employee={employee} 
                            dispatchEmployee={dispatchEmployee}
                        />                                                                                            
                        
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}

export default App