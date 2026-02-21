import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/api';

const AuthContext = createContext(null);

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function getUserFromToken(token) {
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload) return null;

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('barolab_token');
        return null;
    }

    return {
        id: payload.sub,
        role: payload.role,
        username: payload.username,
    };
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('barolab_token'));
    const [user, setUser] = useState(() => getUserFromToken(localStorage.getItem('barolab_token')));

    useEffect(() => {
        if (token) {
            localStorage.setItem('barolab_token', token);
            setUser(getUserFromToken(token));
        } else {
            localStorage.removeItem('barolab_token');
            setUser(null);
        }
    }, [token]);

    const loginUser = async (login, password) => {
        const data = await api.login(login, password);
        setToken(data.token);
        return data;
    };

    const signUpUser = async (login, email, username, password) => {
        const data = await api.signUp(login, email, username, password);
        setToken(data.token);
        return data;
    };

    const logout = () => {
        setToken(null);
    };

    const isAuthenticated = !!user;
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isAdmin,
                isSuperAdmin,
                login: loginUser,
                signUp: signUpUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
