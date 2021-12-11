import React from 'react'
import {Route, Redirect} from 'react-router-dom'
import {isAuth} from './Auth'

// Protect the route from the unauthenticated user
function ProtectedRoute({component: Component, ...rest}){
    // When the user is not authenticated
    if(!isAuth()){
        return <Redirect to={'/login'}/>
    }
    return (
        <Route {...rest} render={
                () => <Component/>
            }
        />
    )
}

export default ProtectedRoute