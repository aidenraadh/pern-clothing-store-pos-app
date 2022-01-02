import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import { useState } from 'react'
import {Buttons} from '../Buttons'
import {Modal} from '../Windows'

const callApi = () => {
    api.get('/inventories')
       .then((response) => {console.log(response)})
}

function TestPage(props){
    const [shown, setShown] = useState(false)
    return (<>
        <h1>asd</h1>
        <Buttons attr={{onClick: callApi}} />
    </>)
}

export default TestPage