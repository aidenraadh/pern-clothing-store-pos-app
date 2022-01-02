import React from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'
import NotFoundPage from './components/pages/NotFoundPage'

import "./index.css";

function App(){
    return (
        <ErrorBoundary>
            <Router>
                <Navigation/>
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