import {logout} from '../Auth'
import {Button} from '../Buttons'

function DashboardPage(props){
    return (<>
        <h1>This is home</h1>
        <Button 
            text={'Logout'} size={'sm'} color={'red'}
            attr={{onClick: logout}} 
        />         
    </>)
}

export default DashboardPage