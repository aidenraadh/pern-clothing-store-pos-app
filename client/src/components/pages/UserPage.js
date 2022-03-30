import {useState, useEffect} from 'react'
import {OWNER_ACTIONS, OWNER_FILTER_KEY} from '../reducers/OwnerReducer'
import {EMPLOYEE_ACTIONS, EMPLOYEE_FILTER_KEY} from '../reducers/EmployeeReducer'
import {api, errorHandler, getResFilters, getQueryString} from '../Utils.js'
import {Button} from '../Buttons'

import {TabbedCard} from '../Cards'

const callApi = () => {
    api.get('/test')
       .then((response) => {console.log(response.data)})
}

function UserPage(props){
    return (<>
    <TabbedCard
        tabs={[ 
            {link: 'Owner', panelID: 'owner', panelContent:
                'This is owner tab.'
            },
            {link: 'Employee', panelID: 'employee', panelContent:
                'This is employee tab.'
            },										
        ]}
        currentPanelID={'owner'}    
    />          
    </>)
}

export default UserPage