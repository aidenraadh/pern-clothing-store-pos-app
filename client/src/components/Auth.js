const hostname = window.location.hostname
// Check if the user auth status
// returns true if authenticated, false otherwise
export const isAuth = () => (
    localStorage.getItem(`${hostname}_jwt_token`) ?
    true : false
)
// Clear the user's token dan data from local storage then redirect to login page
export const logout = () => {
    localStorage.removeItem(`${hostname}_jwt_token`)
    localStorage.removeItem(`${hostname}_user`)
    localStorage.removeItem(`${hostname}_resource_filters`)
    window.location.replace(`${window.location.origin}/login`);
}
// Store the user's token and data to local storage then redirect to home page
export const login = (response = null) => {
    if(response){
        localStorage.setItem(`${hostname}_jwt_token`, response.data.token)
        saveUser(response.data.user)
    }
    window.location.replace(window.location.origin);
}
// Save the user to local storage
export const saveUser = (user) => {
    localStorage.setItem(
        `${hostname}_user`, JSON.stringify(user)
    )
}
// Get the user from local storage
export const getUser = () => {
    const user = localStorage.getItem(`${hostname}_user`)
    return user ? JSON.parse(user) : user
}