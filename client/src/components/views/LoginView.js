import {useState}  from "react"
import {api} from '../Utils'
import {Redirect} from "react-router"
import {Link} from "react-router-dom"
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

const LoginView = (props) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    // When the user already authenticated
    if(isAuth()){
        return <Redirect to={'/'}/>
    }

    return (<>
        <input type="email" name="email" value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder={'Email'}/>

        <input type="password" name="email" value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder={'Password'}/>
        <br/>
        <button type="button" onClick={() => requestLogin(email, password)}>
            Login
        </button>
        <p>
            Doesn't have an account? <Link to="/register">Register here</Link>
        </p>
    </>)
}

export default LoginView