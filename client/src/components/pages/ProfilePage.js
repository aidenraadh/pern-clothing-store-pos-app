import {useState, useCallback, useMemo, useEffect}  from "react"
import {api, errorHandler} from '../Utils'
import {saveUser, logout} from '../Auth'
import {Button} from '../Buttons'
import {Modal, ConfirmPopup} from '../Windows'
import {TextInput, Select, TextInputWithBtn} from '../Forms'
import {SimpleCard} from '../Cards'
import {Grid} from '../Layouts'

function ProfilePage({user, setPageHeading, loc}){
    const languages = useMemo(() => (
        JSON.parse(localStorage.getItem('languages'))
    ), [])
    const [disableBtn , setDisableBtn] = useState(false)

    const [name, setNameName] = useState(user.name)
    const [languageId, setLanguageId] = useState(user.language_id)
    const [oldPassword, setOldPassword] = useState('')
    const [oldPasswordShown, setOldPasswordShown] = useState(true)
    const [newPassword, setNewPassword] = useState('')  
    const [newPasswordShown, setNewPasswordShown] = useState(true)
    const [updProfileModal, setUpdProfileModal] = useState(false)  
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)    

    const updateProfile = useCallback(() => {
        setDisableBtn(true)
        api.post(`/users/update-profile`, {
            name: name,
            languageId: languageId,
            old_password: oldPassword,
            new_password: newPassword,
        })
        .then(response => {
            saveUser(response.data.user)
            setDisableBtn(false)
            setUpdProfileModal(false)
            setSuccPopupShown(true)

        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})           
        })   
    }, [name, languageId, oldPassword, newPassword, setUpdProfileModal, setDisableBtn])

    useEffect(() => {
        setPageHeading({title: 'Profile', icon: 'user'})
    }, [])

    if(!user){
        return 'Loading ...'
    }
    return (<>
        <SimpleCard
            attr={{id: 'profile-card'}}
            heading={loc.yourProfile}
            body={<>
                <p className="flex-row items-start">
                    <img src='images/user_default_thumbnail.jpg' alt='user avatar'/>
                    <span className="flex-col">
                        <span>{loc.name}: {user.name}</span>
                        <span>Role: {user.role.name}</span>                        
                    </span>
                    <Button text={loc.updateProfile} size={'sm'} attr={{
                        onClick: () => {setUpdProfileModal(true)}
                    }}/>                     
                </p>               
            </>}
            action={<>
                <Button 
                    text={'Logout'} size={'sm'} color={'red'}
                    attr={{onClick: () => {
                        localStorage.removeItem("languages");
                        logout()
                    }}} 
                />              
            </>}
        />
        <Modal
            heading={loc.updateProfile}
            body={<Grid numOfColumns={1} items={[
                <TextInput label={loc.name} formAttr={{
                    value: name, onChange: (e) => {setNameName(e.target.value)}
                }}/>,
                <Select label={loc.language} formAttr={{
                        value: languageId, onChange: (e) => {setLanguageId(e.target.value)}
                    }}
                    options={(() => {
                        const options = []
                        for (const id in languages) {
                            options.push({
                                value: id, text: languages[id].name.charAt(0).toUpperCase() + languages[id].name.slice(1)
                            })
                        }
                        return options                        
                    })()}
                />,
                <TextInputWithBtn label={loc.oldPassword} btnIconName={oldPasswordShown ? 'visible' : 'hidden'}
                    formAttr={{
                        type: (oldPasswordShown ? 'text' : 'password'),
                        value: oldPassword, onChange: (e) => {setOldPassword(e.target.value)}
                    }}
                    btnAttr={{onClick: () => {setOldPasswordShown(state => !state)}}}
                />,
                <TextInputWithBtn label={loc.newPassword} btnIconName={newPasswordShown ? 'visible' : 'hidden'}
                    formAttr={{
                        type: (newPasswordShown ? 'text' : 'password'),
                        value: newPassword, onChange: (e) => {setNewPassword(e.target.value)}
                    }}
                    btnAttr={{onClick: () => {setNewPasswordShown(state => !state)}}}
                />,          
            ]}/>}
            shown={updProfileModal}
            toggleModal={() => {setUpdProfileModal(state => !state)}}
            footer={<Button size={'md'} text={loc.saveChanges} attr={{
                disabled: disableBtn,
                onClick: () => {updateProfile()}
            }}/>}
        />
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
        />   
        <ConfirmPopup
            shown={succPopupShown}
            icon={'done_circle'}
            iconColor={'blue'}
            title={"Success"}
            body={loc.succMsg}
            confirmText={'OK'}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
            confirmCallback={() => {
                // Refresh the page
                window.location.reload()
            }}
        />                   
    </>)
}

export default ProfilePage