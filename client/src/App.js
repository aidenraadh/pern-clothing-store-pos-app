import {useState, useReducer} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import {inventoryReducer, INVENTORY_INIT_STATE} from "./components/reducers/InventoryReducer";

import LoginPage from './components/pages/LoginPage'
import DashboardPage from './components/pages/DashboardPage'
import InventoryPage from './components/pages/InventoryPage'
import NotFoundPage from './components/pages/NotFoundPage'

import './css/content.css';
import './css/components.css';
import './css/layouts.css';
import './css/utilities.css';
import './css/media-queries.css';
// import './css/custom.css';

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const [inventory, dispatchInventory] = useReducer(inventoryReducer, INVENTORY_INIT_STATE)

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
                        sidebarItems={[
                            {
                                icon: 'layers', text: 'Dashboard', link: ''
                            },		
                            {
                                icon: 'hanger', text: 'Inventory', link: 'inventory'
                            },	                                                                                                                																												
                        ]}	
                    /> : ''       
                )}
                <div id="app">
                    <Switch>                  
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={DashboardPage}/>
                        <ProtectedRoute path={'/inventory'} exact component={InventoryPage}
                            inventory={inventory} dispatchInventory={dispatchInventory}
                        />
                        
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}

export default App