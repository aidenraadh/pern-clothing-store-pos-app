import {useState, useReducer, useMemo} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import {inventoryReducer, INIT_STATE as INV_INIT_STATE} from "./components/reducers/InventoryReducer";
import {storeReducer, INIT_STATE as STORE_INIT_STATE} from "./components/reducers/StoreReducer";
import {storeInventoryReducer, INIT_STATE as STOREINV_INIT_STATE} from "./components/reducers/StoreInventoryReducer";
import {storeTransactionReducer, INIT_STATE as STORETRNSC_INIT_STATE} from "./components/reducers/StoreTransactionReducer";
import {inventoryTransferReducer, INIT_STATE as INVTRANSFER_INIT_STATE} from "./components/reducers/InventoryTransferReducer";
import {ownerReducer, OWNER_INIT_STATE} from "./components/reducers/OwnerReducer";
import {employeeReducer, EMPLOYEE_INIT_STATE} from "./components/reducers/EmployeeReducer";

import DashboardPage from './components/pages/DashboardPage'
import LoginPage from './components/pages/LoginPage'
import InventoryPage from './components/pages/InventoryPage'
import StorePage from './components/pages/StorePage'
import IndexStoreInventoryPage from './components/pages/store_inventory/IndexStoreInventoryPage'
import CreateStoreInventoryPage from './components/pages/store_inventory/CreateStoreInventoryPage'
import IndexStoreTransactionPage from './components/pages/store_transaction/IndexStoreTransactionPage'
import CreateStoreTransactionPage from './components/pages/store_transaction/CreateStoreTransactionPage'
import IndexInventoryTransferPage from './components/pages/inventory_transfer/IndexInventoryTransferPage'
import CreateInventoryTransferPage from './components/pages/inventory_transfer/CreateInventoryTransferPage'
import UserPage from './components/pages/UserPage'
import ProfilePage from './components/pages/ProfilePage'
import NotFoundPage from './components/pages/NotFoundPage'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const [inventory, dispatchInventory] = useReducer(inventoryReducer, INV_INIT_STATE)
    const [store, dispatchStore] = useReducer(storeReducer, STORE_INIT_STATE)
    const [storeInv, dispatchStoreInv] = useReducer(storeInventoryReducer, STOREINV_INIT_STATE)
    const [storeTrnsc, dispatchStoreTrnsc] = useReducer(storeTransactionReducer, STORETRNSC_INIT_STATE)
    const [invTransfer, dispatchInvTransfer] = useReducer(inventoryTransferReducer, INVTRANSFER_INIT_STATE)
    const [owner, dispatchOwner] = useReducer(ownerReducer, OWNER_INIT_STATE)
    const [employee, dispatchEmployee] = useReducer(employeeReducer, EMPLOYEE_INIT_STATE)     

    const user = useMemo(() => {
        const user = getUser()
        if(user){ user.role.name = user.role.name.toLowerCase() }
        return user
    }, [])

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
        inventory_transfer: {
            icon: 'share', text: 'Inventory Transfers', link: 'inventory-transfers'
        },          
        user: {
            icon: 'group', text: 'Users', link: 'users'
        },         
    }
    const userAuth = isAuth()

    return (
        <ErrorBoundary>
            <Router>
                {(
                    userAuth ?
                    <Navigations
                        sidebarShown={sidebarShown}
                        toggleSidebar={setSidebarShown}
                        rightWidgets={[
                            <Link to='/profile'>
                                <UserThumbnail 
                                    userName={user.name}
                                    imgUrl={'/images/user_default_thumbnail.jpg'}
                                />                            
                            </Link>
                        ]}
                        sidebarItems={(() => {
                            let sidebarItemNames = []
                            const userRole = user.role.name.toLowerCase()
                            switch(userRole){
                                case 'owner': 
                                    sidebarItemNames = [
                                        'dashboard','inventory','store','store_inventory','store_transaction',
                                        'inventory_transfer', 'user'
                                    ];
                                    break;

                                case 'employee':
                                    sidebarItemNames = ['store_inventory', 'store_transaction', 'inventory_transfer'];
                                    break;

                                default: sidebarItemNames = []; break;
                            }
                            return sidebarItemNames.map(name => sidebarItems[name])
                          
                        })()}	
                    /> : ''       
                )}
                <div id="app" className={userAuth ? 'authenticated': ''}>
                    <Switch>
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={`/${sidebarItems.dashboard.link}`} exact component={DashboardPage} props={{
                            user: user
                        }}/>                        
                        <ProtectedRoute path={`/${sidebarItems.inventory.link}`} exact component={InventoryPage}
                            props={{
                                user: user, inventory: inventory, dispatchInventory: dispatchInventory
                            }}
                        />
                        <ProtectedRoute path={`/${sidebarItems.store.link}`} exact component={StorePage}
                            props={{
                                user: user, store: store, dispatchStore: dispatchStore
                            }}
                        />     
                        <ProtectedRoute path={`/${sidebarItems.store_inventory.link}`} exact component={IndexStoreInventoryPage}
                            props={{
                                user: user, storeInv: storeInv, dispatchStoreInv: dispatchStoreInv
                            }}
                        />        
                        <ProtectedRoute path={`/${sidebarItems.store_inventory.link}/create`} exact 
                            component={CreateStoreInventoryPage} prop={{
                                user: user, storeInv: storeInv, dispatchStoreInv: dispatchStoreInv
                            }}
                        /> 
                        <ProtectedRoute path={`/${sidebarItems.store_transaction.link}`} exact 
                            component={IndexStoreTransactionPage} props={{
                                user: user, storeTrnsc: storeTrnsc, dispatchStoreTrnsc: dispatchStoreTrnsc
                            }}
                        />                                                  
                        <ProtectedRoute path={`/${sidebarItems.store_transaction.link}/create`} exact 
                            component={CreateStoreTransactionPage} props={{
                                user: user, storeInv: storeInv, dispatchStoreInv: dispatchStoreInv
                            }}
                        />                      
                        <ProtectedRoute path={`/${sidebarItems.inventory_transfer.link}`} exact 
                        component={IndexInventoryTransferPage} props={{
                            user: user, invTransfer: invTransfer, dispatchInvTransfer: dispatchInvTransfer
                        }}/>              
                        <ProtectedRoute path={`/${sidebarItems.inventory_transfer.link}/create`} exact 
                            component={CreateInventoryTransferPage} props={{user: user}}
                        />                                   
                        <ProtectedRoute path={`/${sidebarItems.user.link}`} exact component={UserPage}
                            props={{
                                user: user, owner: owner, dispatchOwner: dispatchOwner, employee: employee,
                                dispatchEmployee: dispatchEmployee
                            }}
                        />       
                        <ProtectedRoute path={`/profile`} exact component={ProfilePage} props={{
                            user: user
                        }}/>                                                                                                                
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}


export default App