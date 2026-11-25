import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import jwtDecode from 'jwt-decode';
import i18n from '../i18n';
import { refreshAccessToken, clearStoredAuth, AUTH_LOGOUT_EVENT } from '../api/axius';
import { logoutUser } from './authService';

const AuthContext = createContext();

const parseStoredUser = () => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
        return null;
    }
    try {
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const validateToken = useCallback((token) => {
        if (!token || typeof token !== 'string') return false;
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch (err) {
            console.error('Token validation failed:', err);
            return false;
        }
    }, []);

    const logout = useCallback(({ skipServer = false } = {}) => {
        try {
            const currentRefreshToken = localStorage.getItem('refreshToken');
            clearStoredAuth();
            setIsAuthenticated(false);
            setUser(null);

            if (!skipServer && currentRefreshToken) {
                logoutUser(currentRefreshToken).catch((err) => {
                    console.error('Server logout failed:', err);
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
            setError(err);
        }
    }, []);

    const handleTokenRefresh = useCallback(async () => {
        try {
            const refreshed = await refreshAccessToken();
            setIsAuthenticated(true);
            return refreshed;
        } catch (err) {
            console.error('Token refresh failed:', err);
            logout({ skipServer: true });
            return null;
        }
    }, [logout]);

    const initializeAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const storedUser = parseStoredUser();

            if (!token && !refreshToken) {
                clearStoredAuth();
                setIsAuthenticated(false);
                setUser(null);
                return;
            }

            if (token && validateToken(token) && storedUser) {
                setIsAuthenticated(true);
                setUser(storedUser);
                return;
            }

            if (refreshToken) {
                const refreshed = await handleTokenRefresh();
                if (refreshed) {
                    const resolvedUser = refreshed.user
                        ? { ...(storedUser || {}), ...refreshed.user }
                        : storedUser;
                    if (resolvedUser) {
                        localStorage.setItem('user', JSON.stringify(resolvedUser));
                        setUser(resolvedUser);
                    }
                    setIsAuthenticated(true);
                }
                return;
            }

            logout({ skipServer: true });
        } catch (err) {
            console.error('Auth initialization error:', err);
            logout({ skipServer: true });
        } finally {
            setIsLoading(false);
        }
    }, [handleTokenRefresh, logout, validateToken]);

    const persistAuthSession = useCallback((userData) => {
        try {
            if (!userData?.token) {
                throw new Error('Missing access token');
            }
            localStorage.setItem('jwtToken', userData.token);
            if (userData.refreshToken) {
                localStorage.setItem('refreshToken', userData.refreshToken);
            }
            const { token, refreshToken, ...safeUserData } = userData;
            const userToStore = Object.keys(safeUserData).length > 0 ? safeUserData : userData;
            localStorage.setItem('user', JSON.stringify(userToStore));
            setIsAuthenticated(true);
            setUser(userToStore);
        } catch (err) {
            console.error('Persist auth session error:', err);
            setError(err);
        }
    }, []);

    const login = useCallback((userData) => {
        persistAuthSession(userData);
    }, [persistAuthSession]);

    const googleLogin = useCallback((userData) => {
        persistAuthSession(userData);
    }, [persistAuthSession]);

    const facebookLogin = useCallback((userData) => {
        persistAuthSession(userData);
    }, [persistAuthSession]);

    const updateUser = useCallback((newUserData) => {
        setUser((prevUser) => {
            if (!prevUser) {
                return null;
            }
            const updatedUser = { ...prevUser, ...newUserData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        const handleForcedLogout = () => {
            setIsAuthenticated(false);
            setUser(null);
        };

        window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
        return () => {
            window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
        };
    }, []);

    if (error) {
        return (
            <div className="error-fallback">
                <h2>{i18n.t('common.somethingWentWrong')}</h2>
                <p>{error.message}</p>
                <button onClick={() => window.location.reload()}>{i18n.t('common.tryAgain')}</button>
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
            googleLogin,
            facebookLogin,
            updateUser,
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