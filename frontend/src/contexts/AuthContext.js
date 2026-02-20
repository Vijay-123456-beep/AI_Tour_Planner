import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token/user on load
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        if (token && userData) {
            setCurrentUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                const { user, token } = response.data.data;
                setCurrentUser(user);
                localStorage.setItem('authToken', token);
                localStorage.setItem('userData', JSON.stringify(user));
                localStorage.setItem('userEmail', user.email); // Keep for compatibility
                return true;
            }
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data.success) {
                // const { data } = response.data;
                // Auto-login after register? Or just return success
                return true;
            }
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const googleLogin = async () => {
        try {
            // Simulate Google OAuth delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockGoogleUser = {
                email: 'google.user@gmail.com',
                fullName: 'Google User',
                mobile: '9876543210',
                password: 'google-oauth-sim-entry' // Backend bypass or mock
            };

            // First try to login, if fails, register
            try {
                return await login(mockGoogleUser.email, mockGoogleUser.password);
            } catch (e) {
                await register(mockGoogleUser);
                return await login(mockGoogleUser.email, mockGoogleUser.password);
            }
        } catch (error) {
            throw new Error('Google Sign-In simulation failed');
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userEmail');
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
