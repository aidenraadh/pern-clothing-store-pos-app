import {useState, useCallback}  from "react"
import {api, errorHandler} from '../Utils'
import {saveUser} from '../Auth'
import {Button} from '../Buttons'
import {Modal, ConfirmPopup} from '../Windows'
import {TextInput} from '../Forms'
import {Grid} from '../Layouts'

function ProfilePage({user}){
    const [disableBtn , setDisableBtn] = useState(false)

    const [name, setNameName] = useState(user.name)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')  
    const [updProfileModal, setUpdProfileModal] = useState(false)  
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    

    const updateProfile = useCallback(() => {
        setDisableBtn(true)
        api.post(`/users/update-profile`, {
            name: name,
            old_password: oldPassword,
            new_password: newPassword,
        })
        .then(response => {
            saveUser(response.data.user)
            setDisableBtn(false)
            setUpdProfileModal(false)

        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})           
        })   
    }, [name, oldPassword, newPassword, setUpdProfileModal, setDisableBtn])

    if(!user){
        return 'Loading ...'
    }
    return (<>
        <h1>Profile</h1>
        <p>
            Name: {user.name}<br/>
        </p>
        <Button text={'Update profile'} size={'sm'} attr={{
            onClick: () => {setUpdProfileModal(true)}
        }}/>
        <Modal
            heading={'Update Profile'}
            body={<Grid num_of_columns={1} items={[
                <TextInput label={'Name'} formAttr={{
                    value: name, onChange: (e) => {setNameName(e.target.value)}
                }}/>,
                <TextInput label={'Old password'} formAttr={{
                    value: oldPassword, onChange: (e) => {setOldPassword(e.target.value)}
                }}/>,
                <TextInput label={'New password'} formAttr={{
                    value: newPassword, onChange: (e) => {setNewPassword(e.target.value)}
                }}/>,          
            ]}/>}
            shown={updProfileModal}
            toggleModal={() => {setUpdProfileModal(state => !state)}}
            footer={<Button size={'md'} text={'Save changes'} attr={{
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
    </>)
}

export default ProfilePage