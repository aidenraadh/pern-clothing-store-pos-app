import {Redirect} from 'react-router-dom'

function DashboardPage({user}){
    if(user.role.name === 'employee'){
        return <Redirect to={'/store-inventories'}/>
    }
    else if(user.role.name === 'admin'){
        return ''
    }    
}

export default DashboardPage