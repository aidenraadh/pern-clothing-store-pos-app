import {useCallback, useState}  from "react"
import {api, keyHandler} from '../Utils'
import {Navigate} from "react-router"

import {Button} from '../Buttons'
import {TextInput, TextInputWithBtn} from '../Forms'
import {Grid} from '../Layouts'
import { ConfirmPopup } from "../Windows"
import { errorHandler } from "../Utils"
import {isAuth, login} from '../Auth'

const backgroundStyle = {
    background: 'url("images/bg-1.jpg")',
    backgroundPosition: '0 0',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
}

const bg2Style = {
    position: 'absolute',
    top: '0', left: '0',
    width: '100%', height: '100%',
    background: 'linear-gradient(to left, #1058df 0%, #614092 100%)',
    backgroundPosition: '0 0',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    opacity: '0.86' 
}

const redirectPath = {
    admin: '/',
    employee: '/store-inventories'
}

const LoginPage = (props) => {
    const [disableBtn , setDisableBtn] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordShown, setPasswordShown] = useState(false)
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')       

    const requestLogin = useCallback(() => {
        setDisableBtn(true)
        api
            .post('/login', {
                email: email, password: password
            })
            .then(response => {
                const userRole = response.data.user.role.name.toLowerCase()
                localStorage.setItem('languages', JSON.stringify(response.data.languages))
                login(response, redirectPath[userRole])
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error, {
                    '400': () => {
                        setErrPopupShown(true)
                        setErrPopupMsg(error.response.data.message)                      
                    },
                    '401': () => {
                        login()
                    }
                })                 
            })        
    }, [email, password])
    
    // When the user already authenticated
    if(props.isAuth){
        return <Navigate to={redirectPath[props.user.role.name]}/>
    }
    return (<>
        <div id="login-page" className="flex-col items-center content-center" style={backgroundStyle}>      
            <div aria-hidden='true' style={bg2Style}>
            </div>              
            <Grid numOfColumns={1} items={[
                <h1 className="text-bold text-white text-center">Clothing Store App</h1>,
                <TextInput
                    formAttr={{
                        value: email, placeholder: 'Email', 
                        onChange: (e) => {setEmail(e.target.value)},
                        onKeyUp: (e) => {keyHandler(e, 'Enter', requestLogin)}
                    }} 
                />,
                <TextInputWithBtn btnIconName={passwordShown ? 'visible' : 'hidden'}
                    btnAttr={{onClick: () => {setPasswordShown(state => !state)}}}
                    formAttr={{
                        type: passwordShown ? 'text' : 'password', 
                        value: password, placeholder: 'Password', 
                        onChange: (e) => {setPassword(e.target.value)},
                        onKeyUp: (e) => {keyHandler(e, 'Enter', requestLogin)}
                    }} 
                />,      
                <Button text={'Login'} attr={{
                    disabled: disableBtn,
                    onClick: requestLogin
                }}/>  
            ]}/>                         
        </div>
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
        />    
        <footer id="footer" className="flex-row content-space-between text-white">
            <span></span>
            <span>
                Developed by: <a className="text-blue text-underline" target="_blank" href="https://aidenraadh.com/">aidenraadh.com</a>
                </span>
        </footer>            
    </>)
}

export default LoginPage