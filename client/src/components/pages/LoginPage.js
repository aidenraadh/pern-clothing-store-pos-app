import {useCallback, useState}  from "react"
import {api, keyHandler} from '../Utils'
import {Redirect} from "react-router"

import {Button} from '../Buttons'
import {TextInput, TextInputWithBtn} from '../Forms'
import {Grid} from '../Layouts'
import { ConfirmPopup } from "../Windows"
import { errorHandler } from "../Utils"
import {isAuth, login} from '../Auth'

const backgroundStyle = {
    background: 'url("images/bg-1.png") no-repeat scroll 0 0',
    backgroundSize: 'cover'
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
                localStorage.setItem('languages', JSON.stringify(response.data.languages))
                login(response, '/')
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
    if(isAuth()){
        return <Redirect to={'/'}/>
    }
    return (<>
        <div id="login-page" className="flex-col items-center content-center" style={backgroundStyle}>
            <Grid numOfColumns={1} items={[
                <h1 className="text-bold text-white text-center">HNSports</h1>,
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
    </>)
}

export default LoginPage