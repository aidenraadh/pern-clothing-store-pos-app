import {useState, useMemo} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'

import Protected from './components/Protected'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

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

import {
    InventoryPageLocalization,
    StorePageLocalization,
    IndexStoreInventoryPageLocalization,
    CreateStoreInventoryPageLocalization,
    IndexStoreTransactionPageLocalization,
    CreateStoreTransactionPageLocalization,
    NavigationsLocalization,
    ProfilePageLocalization,
    IndexInventoryTransferPageLocalization,
    CreateInventoryTransferPageLocalization,
    DashboardPageLocalization,
    UserPageLocalization
} from './localizations/index.js'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const [pageHeading, setPageHeading] = useState({title: '', icon: ''})
    const [totalInvs, setTotalInvs] = useState(undefined) 
    const [totalStoredInvs, setTotalStoredInvs] = useState(undefined)
    const [totalProdPrices, setTotalProdPrices] = useState(undefined)
    const [totalRevenue, setTotalRevenue] = useState(undefined)
    const [totalSoldInvs, setTotalSoldInvs] = useState(undefined)

    const userAuth = isAuth()

    const user = useMemo(() => {
        const user = getUser()
        if(user){ user.role.name = user.role.name.toLowerCase() }
        return user
    }, [])

    const languageName = useMemo(() => {
        if(!user){
            return 'english'
        }
        const languages = JSON.parse(localStorage.getItem('languages'))

        if(!languages){ return 'english' }
        if(!languages[user.language_id]){ return 'english' }

        return languages[user.language_id].name
    }, [user])

    const sidebarItems = {  
        dashboard: {
            icon: 'layers', text: 'Dashboard', path: ''
        },                
        inventory: {
            icon: 'hanger', text: NavigationsLocalization[languageName].inventories, path: 'inventories'
        },
        store: {
            icon: 'ecm004', text: NavigationsLocalization[languageName].stores, path: 'stores'
        },
        store_inventory: {
            icon: 'gen017', text: NavigationsLocalization[languageName].storeInvs, path: 'store-inventories'
        },
        store_transaction: {
            icon: 'cart', text: NavigationsLocalization[languageName].storeTrnscs, path: 'store-transactions'
        },        
        inventory_transfer: {
            icon: 'share', text: NavigationsLocalization[languageName].invTransfers, path: 'inventory-transfers'
        },          
        user: {
            icon: 'group', text: 'Users', path: 'users'
        },         
    }    

    return (
        <ErrorBoundary>
            <Router>
                {(
                    userAuth ?
                    <Navigations
                        pageHeading={pageHeading}
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
                                case 'admin': 
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
                <div id="app" className={userAuth ? '': 'unauthenticated'}>
                    <Routes>
                        <Route path="/login" exact element={<LoginPage isAuth={userAuth} user={user}/>}/>
                        <Route path={`/${sidebarItems.dashboard.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <DashboardPage
                                    setPageHeading={setPageHeading}
                                    user={user} loc={DashboardPageLocalization[languageName]}
                                    totalInvs={totalInvs} setTotalInvs={setTotalInvs}
                                    totalStoredInvs={totalStoredInvs} setTotalStoredInvs={setTotalStoredInvs}
                                    totalProdPrices={totalProdPrices} setTotalProdPrices={setTotalProdPrices}
                                    totalRevenue={totalRevenue} setTotalRevenue={setTotalRevenue}
                                    totalSoldInvs={totalSoldInvs} setTotalSoldInvs={setTotalSoldInvs}                             
                                />
                            </Protected>
                        }/>                     
                        <Route path={`/${sidebarItems.inventory.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <InventoryPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={InventoryPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>         
                        <Route path={`/${sidebarItems.store.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <StorePage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={StorePageLocalization[languageName]}
                                />
                            </Protected>
                        }/>         
                        <Route path={`/${sidebarItems.store_inventory.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <IndexStoreInventoryPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={IndexStoreInventoryPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>        
                        <Route path={`/${sidebarItems.store_inventory.path}/create`} exact element={
                            <Protected isAuth={userAuth}>
                                <CreateStoreInventoryPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={CreateStoreInventoryPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>       
                        <Route path={`/${sidebarItems.store_transaction.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <IndexStoreTransactionPage
                                    user={user} setPageHeading={setPageHeading}
                                    loc={IndexStoreTransactionPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>    
                        <Route path={`/${sidebarItems.store_transaction.path}/create`} exact element={
                            <Protected isAuth={userAuth}>
                                <CreateStoreTransactionPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={CreateStoreTransactionPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>    
                        <Route path={`/${sidebarItems.inventory_transfer.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <IndexInventoryTransferPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={IndexInventoryTransferPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>     
                       <Route path={`/${sidebarItems.inventory_transfer.path}/create`} exact element={
                            <Protected isAuth={userAuth}>
                                <CreateInventoryTransferPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={CreateInventoryTransferPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>   
                        <Route path={`/${sidebarItems.user.path}`} exact element={
                            <Protected isAuth={userAuth}>
                                <UserPage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={UserPageLocalization[languageName]}
                                />
                            </Protected>
                        }/>        
                        <Route path={`/profile`} exact element={
                            <Protected isAuth={userAuth}>
                                <ProfilePage 
                                    user={user} setPageHeading={setPageHeading}
                                    loc={ProfilePageLocalization[languageName]}
                                />
                            </Protected>
                        }/>     
                        <Route path={`*`} element={<NotFoundPage/>}/>                                                                                                                                                                                                                                 
                    </Routes>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}


export default App