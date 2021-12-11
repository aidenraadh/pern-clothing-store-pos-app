import {useState, useEffect}  from "react"
import {api, errorHandler} from '../Utils'
import {storeUser, getUser} from '../Auth'

const getProfile = (setProfile) => {
    api
        .get('/profile')
        .then(response => {
            storeUser(response.data.user)
            setProfile(response.data.user)
        })
        .catch(error => errorHandler(error))
}

const updateProfile = (name, email, oldPassword, newPassword, setProfile) => {
    api
        .put('/profile', {
            name: name, email: email, password: newPassword,
            oldPassword: oldPassword
        })
        .then(response => {
            setProfile(response.data.user)
        })
        .catch(error => errorHandler(error))    
}

function ProfileView(){
    const [profile, setProfile] = useState(getUser())

    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    // Get the user profile if it is not exist
    useEffect(() => {
        if(!getUser()){
            getProfile(setProfile)
        }
    }, [])

    // Update the update profile field if the profile is changed
    useEffect(() => {
        setNewName(profile.name)
        setNewEmail(profile.email)
        setOldPassword('')
        setNewPassword('')
    }, [profile])    

    if(!profile){
        return 'Loading ...'
    }
    return (<>
        <h1>Profile</h1>
        <p>
            Name: {profile.name}<br/>
            Email: {profile.email}<br/>
        </p>
        <section>
            <h3>Update Profile</h3>
            <input type="text" value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            placeholder={'Name'}/> 

            <input type="email" value={newEmail} 
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={'Email'}/> 

            <input type="password" value={oldPassword} 
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder={'Old password'}/>            

            <input type="password" value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={'New password'}/>        

            <br/>         

            <button type="button" onClick={() => {updateProfile(
                newName, newEmail, oldPassword, newPassword,
                setProfile
            )}}>
                Update profile
            </button>

        </section>
    </>)
}

export default ProfileView