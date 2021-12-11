// Check if the user auth status
// returns true if authenticated, false otherwise
export const isAuth = () => (
    localStorage.getItem('jwt_token') ?
    true : false
)
// Clear the user's token dan data then redirect to login page
export const logout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user')
    window.location.replace(`${window.location.origin}/login`);
}
// Store the user's token and data then redirect to home page
export const login = (response = null) => {
    if(response){
        localStorage.setItem('jwt_token', response.data.token)
        storeUser(response.data.user)
    }
    window.location.replace(window.location.origin);
}
// Store the user 
export const storeUser = (user) => {
    localStorage.setItem(
        'user', JSON.stringify(user)
    )
}
// Get the user's data
export const getUser = () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : user
}