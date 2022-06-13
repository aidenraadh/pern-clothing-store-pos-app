import React from 'react'
import {Navigate} from 'react-router-dom'

// Protect the route from the unauthenticated user
function Protected({isAuth, children}){
    // When the user is not authenticated
    if(!isAuth){
        return <Navigate to={'/login'}/>
    }
    return children
}

export default Protected