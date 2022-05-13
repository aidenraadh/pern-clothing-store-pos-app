import {useState}  from "react"
import {api} from '../Utils'
import {Redirect} from "react-router"

import {Button} from '../Buttons'
import {TextInput, TextInputWithBtn} from '../Forms'
import {isAuth, login} from '../Auth'

const LoginPage = (props) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordShown, setPasswordShown] = useState(false)
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
        <TextInputWithBtn btnIconName={passwordShown ? 'visible' : 'hidden'}
            btnAttr={{onClick: () => {setPasswordShown(state => !state)}}}
            formAttr={{
                type: passwordShown ? 'text' : 'password', 
                value: password, placeholder: 'Password', 
                onChange: (e) => {setPassword(e.target.value)}
            }} 
        />        
        <Button 
            attr={{onClick: () => {requestLogin(email, password)}}} 
            text={'Login'}
        />
    </>)
}

const requestLogin = (email, password) => {
    api
        .post('/login', {
            email: email, password: password
        })
        .then(response => login(response, '/inventories'))
        .catch(error => {
            if(error.response.status === 400){
                alert(error.response.data.message)
            }            
            if(error.response.status === 401){
                login()
            }
        })
}

export default LoginPage