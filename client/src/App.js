import React from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import HomePage from './components/pages/HomePage'
import ProfilePage from './components/pages/ProfilePage'
import NotFoundPage from './components/pages/NotFoundPage'
import TestPage from "./components/pages/TestPage";

import "./index.css";

function App(){
    return (
        <ErrorBoundary>
            <Router>
                <Navigation/>
                <Switch>
                    {/* <Route path="/register" exact component={RegisterView}/>
                    <Route path="/login" exact component={LoginView}/>
                    <ProtectedRoute path={'/'} exact component={HomeView}/>
                    <ProtectedRoute path={'/profile'} exact component={ProfileView}/>*/}
                    <Route path="/test" exact component={TestPage}/>
                    
                    <Route path={'*'} component={NotFoundPage}/>
                </Switch>
            </Router>
        </ErrorBoundary>
    )
}

export default App