// Check if the user auth status
// returns true if authenticated, false otherwise
export const isAuth = () => (
    localStorage.getItem('jwt_token') ?
    true : false
)
// Clear the user's token dan data from local storage then redirect to login page
export const logout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user')
    localStorage.removeItem('resource_filters')
    window.location.replace(`${window.location.origin}/login`);
}
// Store the user's token and data to local storage then redirect to home page
export const login = (response = null) => {
    if(response){
        localStorage.setItem('jwt_token', response.data.token)
        saveUser(response.data.user)
    }
    window.location.replace(window.location.origin);
}
// Save the user to local storage
export const saveUser = (user) => {
    localStorage.setItem(
        'user', JSON.stringify(user)
    )
}
// Get the user from local storage
export const getUser = () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : user
}