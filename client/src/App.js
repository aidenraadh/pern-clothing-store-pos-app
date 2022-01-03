import {useState} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth} from './components/Auth'
import Navigations from './components/Navigations'
import {SVGIcons} from './components/Misc'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'
import NotFoundPage from './components/pages/NotFoundPage'

import "./index.css";

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    return (
        <ErrorBoundary>
            <Router>
                {(
                    isAuth() ?
                    <Navigations
                        app_url={''}
                        app_logo_url={''}
                        sidebarShown={sidebarShown}
                        showSidebar={() => {setSidebarShown(state => !state)}}
                        sidebar_items={[
                            {
                                content: <a className="sidebar-item">
                                    <SVGIcons name={'layers'} color={''} />
                                    <span className="text">Dashboard</span>                      
                                </a>,
                                active: true,
                            },																													
                        ]}	
                    /> : ''       
                )}              
                <Switch>                  
                    <Route path="/login" exact component={LoginPage}/>
                    <ProtectedRoute path={'/'} exact component={HomePage}/>
                    
                    <Route path={'*'} component={NotFoundPage}/>
                </Switch>
            </Router>
        </ErrorBoundary>
    )
}

export default App