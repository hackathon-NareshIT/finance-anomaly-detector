import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        if (savedToken && savedUser) {
            try {
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
            } catch (e) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
    }, [])
    const login = (userData, accessToken) => {
        setUser(userData)
        setToken(accessToken)
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
