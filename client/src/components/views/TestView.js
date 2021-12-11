import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {Buttons} from '../Buttons'

function TestView(props){
    return (<>
        <h1>asd</h1>
        <Buttons settings={{size: 'sm', type: 'primary', color: 'blue', text:'asd'}} />
    </>)
}

export default TestView