import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setCurrentUser({ id: 'user123', email: 'user@example.com' });
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        setCurrentUser({ id: 'user123', email });
        localStorage.setItem('authToken', 'dummy-token');
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
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
