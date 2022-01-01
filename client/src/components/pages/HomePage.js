import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'

function HomePage(props){
    return (<>
        <h1>This is home</h1>
        <button type="button" onClick={logout}>
            Logout
        </button>      
    </>)
}

export default HomePage