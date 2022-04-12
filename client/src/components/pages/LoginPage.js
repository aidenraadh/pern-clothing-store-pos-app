import {useState}  from "react"
import {api} from '../Utils'
import {Redirect} from "react-router"

import {Button} from '../Buttons'
import {TextInput} from '../Forms'
import {isAuth, login} from '../Auth'

const requestLogin = (email, password) => {
    api
        .post('/login', {
            email: email, password: password
        })
        .then(response => login(response))
        .catch(error => {
            // When the credentials are wrong
            if(error.response.status === 400){
                alert(error.response.data.message)
            }            
            // When the user already logged in on the server
            if(error.response.status === 401){
                login()
            }
        })
}

const LoginPage = (props) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    // When the user already authenticated
    if(isAuth()){
        return <Redirect to={'/'}/>
    }

    return (<>
        <TextInput
            formAttr={{
                value: email, placeholder: 'Email', 
                onChange: (e) => {setEmail(e.target.value)}
            }} 
        />
        <TextInput
            formAttr={{
                type: 'password', value: password, placeholder: 'Password', 
                onChange: (e) => {setPassword(e.target.value)}
            }} 
        />        
        <Button 
            attr={{onClick: () => {requestLogin(email, password)}}} 
            text={'Login'}
        />
    </>)
}

export default LoginPage