import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from '../api/axius';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // Track the refresh state
    const [error, setError] = useState(null);

    const validateToken = (token) => {
        if (!token || typeof token !== 'string') return false;
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    };

    const initializeAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const storedUser = JSON.parse(localStorage.getItem('user'));

            if (!token || !storedUser) {
                setIsLoading(false);
                return;
            }

            if (validateToken(token)) {
                setIsAuthenticated(true);
                setUser(storedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    await handleTokenRefresh(); // Try refreshing the token
                    setUser(storedUser);
                } else {
                    logout();
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTokenRefresh = useCallback(async () => {
        if (isRefreshing) {
            return; // Prevent multiple refresh requests from being sent
        }
        setIsRefreshing(true); 
        
        try {
            const response = await axios.post('/Account/refresh-token', {
                refreshToken: localStorage.getItem('refreshToken')
            });
            const newToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            localStorage.setItem('jwtToken', newToken);         
            if (newRefreshToken && newRefreshToken !== localStorage.getItem('refreshToken')) {
                localStorage.setItem('refreshToken', newRefreshToken);
            }
            setIsAuthenticated(true); 
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout(); 
        } finally {
            setIsRefreshing(false); 
        }
    }, [isRefreshing]);

    const login = useCallback((userData) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setIsAuthenticated(true);
            setUser(userData);
        } catch (error) {
            console.error('Login error:', error);
            setError(error);
        }
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            setError(error);
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Error boundary UI
    if (error) {
        return (
            <div className="error-fallback">
                <h2>Something went wrong</h2>
                <p>{error.message}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated,
            isLoading,
            user,
            login,
            logout,
            error
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
