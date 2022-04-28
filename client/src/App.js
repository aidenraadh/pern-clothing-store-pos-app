import {useState, useReducer} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

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
import IndexStoreTransactionPage from './components/pages/store_transaction/IndexStoreTransactionPage'
import CreateStoreTransactionPage from './components/pages/store_transaction/CreateStoreTransactionPage'
import UserPage from './components/pages/UserPage'
import ProfilePage from './components/pages/ProfilePage'
import NotFoundPage from './components/pages/NotFoundPage'

import './index.css';

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
            icon: 'hanger', text: 'Inventories', link: 'inventories'
        },
        store: {
            icon: 'ecm004', text: 'Stores', link: 'stores'
        },
        store_inventory: {
            icon: 'gen017', text: 'Store Inventories', link: 'store-inventories'
        },
        store_transaction: {
            icon: 'cart', text: 'Store Transactions', link: 'store-transactions'
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
                            <UserThumbnail userName={
                                <Link to='/profile'>{user.name}</Link>
                            }/>
                        ]}
                        sidebarItems={(() => {
                            let sidebarItemNames = []
                            const userRole = user.role.name.toLowerCase()
                            switch(userRole){
                                case 'owner': 
                                    sidebarItemNames = [
                                        'dashboard','inventory','store','store_inventory','store_transaction',
                                        'user'
                                    ];
                                    break;

                                case 'employee':
                                    sidebarItemNames = ['dashboard','store_inventory', 'store_transaction'];
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
                        <ProtectedRoute path={`/${sidebarItems.inventory.link}`} exact component={InventoryPage}
                            user={user} inventory={inventory} dispatchInventory={dispatchInventory}
                        />
                        <ProtectedRoute path={`/${sidebarItems.store.link}`} exact component={StorePage}
                            user={user} store={store} dispatchStore={dispatchStore}
                        />     
                        <ProtectedRoute path={`/${sidebarItems.store_inventory.link}`} exact component={IndexStoreInventoryPage}
                            user={user} storeInv={storeInv} dispatchStoreInv={dispatchStoreInv}
                        />        
                        <ProtectedRoute path={`/${sidebarItems.store_inventory.link}/create`} exact 
                            component={CreateStoreInventoryPage} user={user} storeInv={storeInv} 
                            dispatchStoreInv={dispatchStoreInv}
                        /> 
                        <ProtectedRoute path={`/${sidebarItems.store_transaction.link}`} exact 
                            component={IndexStoreTransactionPage} user={user} storeTrnsc={storeTrnsc} 
                            dispatchStoreTrnsc={dispatchStoreTrnsc}
                        />                          
                        <ProtectedRoute path={`/${sidebarItems.store_transaction.link}/create`} exact 
                            component={CreateStoreTransactionPage} user={user} storeInv={storeInv} 
                            dispatchStoreInv={dispatchStoreInv}
                        />                         
                        <ProtectedRoute path={`/${sidebarItems.user.link}`} exact component={UserPage}
                            user={user} owner={owner} dispatchOwner={dispatchOwner} employee={employee} 
                            dispatchEmployee={dispatchEmployee}
                        />       
                        <ProtectedRoute path={`/profile`} exact component={ProfilePage}
                            user={user}
                        />                                                                                                                
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}


export default App