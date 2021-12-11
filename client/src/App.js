import React from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'

import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'

import LoginView from './components/views/LoginView'
import RegisterView from './components/views/RegisterView'
import HomeView from './components/views/HomeView'
import ProfileView from './components/views/ProfileView'
import NotFoundView from './components/views/NotFoundView'
import TestView from "./components/views/TestView";

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
                    <Route path="/test" exact component={TestView}/>
                    
                    <Route path={'*'} component={NotFoundView}/>
                </Switch>
            </Router>
        </ErrorBoundary>
    )
}

export default App