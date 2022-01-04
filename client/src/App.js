import {useState} from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import './css/content.css';
import './css/components.css';
import './css/layouts.css';
import './css/utilities.css';
import './css/media-queries.css';
// import './css/custom.css';

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'
import NotFoundPage from './components/pages/NotFoundPage'

import "./index.css";

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
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
                                icon: '', text: 'Dashboard',
                                active: true,
                            },		                                                                                    																												
                        ]}	
                    /> : ''       
                )}
                <div id="app">
                    <Switch>                  
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={HomePage}/>
                        
                        <Route path={'*'} component={NotFoundPage}/>
                    </Switch>                    
                </div>      
            </Router>
        </ErrorBoundary>
    )
}

export default App