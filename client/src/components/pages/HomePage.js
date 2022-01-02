import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {Button} from '../Buttons'

const callApi = () => {
    api.get('/inventories')
       .then((response) => {console.log(response.data.inventories)})
}

function HomePage(props){
    return (<>
        <h1>This is home</h1>
        <Button 
            settings={{type: 'primary', size: 'sm', color: 'blue'}}
            attr={{onClick: callApi}} 
            text={'API'}
        />
        <Button 
            settings={{type: 'primary', size: 'sm', color: 'red'}}
            attr={{onClick: logout}} 
            text={'Logout'}
        />           
    </>)
}

export default HomePage