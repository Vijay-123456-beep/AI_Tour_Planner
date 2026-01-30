import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const TransportContext = createContext();

export const TransportProvider = ({ children }) => {
    const [bookings, setBookings] = useState([]);
    const [selectedTransport, setSelectedTransport] = useState(null);

    // Load bookings from localStorage and MongoDB on mount
    useEffect(() => {
        try {
            const savedBookings = localStorage.getItem('bookings');
            if (savedBookings) {
                setBookings(JSON.parse(savedBookings));
            }
        } catch (error) {
            console.error('Error loading bookings from localStorage:', error);
        }

        // Try to fetch from backend
        try {
            api.get('/api/transport/bookings').then(response => {
                if (response.data.success && response.data.data.length > 0) {
                    setBookings(response.data.data);
                }
            }).catch(err => console.warn('Could not fetch bookings from backend:', err));
        } catch (error) {
            console.warn('Backend bookings fetch failed:', error);
        }
    }, []);

    // Save bookings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('bookings', JSON.stringify(bookings));
        } catch (error) {
            console.error('Error saving bookings to localStorage:', error);
        }
    }, [bookings]);

    const addBooking = (booking) => {
        const newBooking = {
            id: Date.now().toString(),
            ...booking,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        setBookings([newBooking, ...bookings]);

        // Try to save to backend
        try {
            api.post('/api/transport/book', newBooking).catch(err =>
                console.warn('Could not save booking to backend:', err)
            );
        } catch (error) {
            console.warn('Backend booking save failed:', error);
        }

        return newBooking;
    };

    const deleteBooking = (id) => {
        setBookings(bookings.filter(b => b.id !== id));

        // Try to delete from backend
        try {
            api.delete(`/api/transport/bookings/${id}/delete`).catch(err =>
                console.warn('Could not delete booking from backend:', err)
            );
        } catch (error) {
            console.warn('Backend booking delete failed:', error);
        }
    };

    const updateBooking = (id, updates) => {
        setBookings(bookings.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const getBooking = (id) => {
        return bookings.find(b => b.id === id);
    };

    const getBookingsByItinerary = (itineraryId) => {
        return bookings.filter(b => String(b.itineraryId) === String(itineraryId));
    };

    return (
        <TransportContext.Provider value={{
            bookings,
            selectedTransport,
            setSelectedTransport,
            addBooking,
            deleteBooking,
            updateBooking,
            getBooking,
            getBookingsByItinerary
        }}>
            {children}
        </TransportContext.Provider>
    );
};

export const useTransport = () => {
    const context = useContext(TransportContext);
    if (!context) {
        throw new Error('useTransport must be used within TransportProvider');
    }
    return context;
};
