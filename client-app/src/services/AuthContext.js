import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { verifyEmail } from './authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    // Add useCallback to memoize the function
    const updateUser = useCallback((newUserData) => {
        setUser(prev => {
            const updatedUser = { ...prev, ...newUserData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (token && storedUser) {
            setIsAuthenticated(true);
            setUser(storedUser);
        }
    }, []);

    const login = useCallback((userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('jwtToken', userData.token);
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
    }, []);

    const verifyAndUpdateEmail = useCallback(async (userId, token) => {
        try {
            const updatedUser = await verifyEmail(userId, token);
            updateUser({
                ...updatedUser,
                emailConfirmed: true
            });
            return true;
        } catch (error) {
            console.error('Verification failed:', error);
            return false;
        }
    }, [updateUser]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            login, 
            logout,
            verifyAndUpdateEmail,
            updateUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);