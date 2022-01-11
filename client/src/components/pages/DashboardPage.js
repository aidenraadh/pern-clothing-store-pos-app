import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {Button} from '../Buttons'

const callApi = () => {
    api.get('/test')
       .then((response) => {console.log(response.data)})
}

function DashboardPage(props){
    return (<>
        <h1>This is home</h1>
        <Button 
            text={'API'} size={'sm'}
            attr={{onClick: callApi}} 
        />
        <Button 
            text={'Logout'} size={'sm'} color={'red'}
            attr={{onClick: logout}} 
        />           
    </>)
}

export default DashboardPage