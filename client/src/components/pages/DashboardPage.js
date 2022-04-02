import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {Button} from '../Buttons'
import {PlainCard} from '../Cards'
import {TextInput} from '../Forms'

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
        <PlainCard 
            body={<>
                <div style={{marginBottom: '2rem'}}>
                    <span>asdasd</span>
                    <Button text={'Click me'} size={'lg'} />
                </div>            
                <div style={{marginBottom: '2rem'}} className='flex-row items-center'>
                    <span>asdasd</span>
                    <Button text={'Click me'} size={'md'} />
                </div>
                <div style={{marginBottom: '2rem'}} className='flex-row items-center'>
                    <span >asdasd</span>
                    <Button text={'Click me'} size={'sm'} iconName={'layers'} attr={{style: {marginRight: '1rem'}}} />
                    <Button text={'Click me'} size={'sm'} iconName={'layers'} iconOnly={true} attr={{style: {marginRight: '1rem'}}} />
                    <TextInput size={'sm'} />
                </div>                
            </>}
        />      
    </>)
}

export default DashboardPage