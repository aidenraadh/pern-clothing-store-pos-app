import {useState}  from "react"
import {api} from '../Utils'
import {Redirect} from "react-router"
import {Link} from "react-router-dom"
import {isAuth, login} from '../Auth'

const requestRegister = (name, email, password) => {
    api
        .post('/register', {
            name: name, email: email, password: password
        })
        .then(response => login(response))
        .catch(error => {
            // Invalid input
            if(error.response.status === 400){
                alert(error.response.data)
            }            
            // When the user already logged in on the server
            if(error.response.status === 401){
                login()
            }
            else{
                console.log(error)
            }
        })
}

const RegisterPage = (props) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    // When the user already authenticated
    if(isAuth()){
        return <Redirect to={'/'}/>
    }

    return (<>
        <input type="text" name="name" value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder={'Name'}/>

        <input type="email" name="email" value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder={'Email'}/>

        <input type="password" name="email" value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder={'Password'}/>
        <br/>
        <button type="button" onClick={() => requestRegister(name, email, password)}>
            Register
        </button>
        <p>
            Already have account? <Link to="/login">Log in here</Link>
        </p>
    </>)
}

export default RegisterPage