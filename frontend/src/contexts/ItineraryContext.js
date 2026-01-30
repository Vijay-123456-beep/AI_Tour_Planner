import React, { createContext, useContext, useState, useEffect } from 'react';

const ItineraryContext = createContext();

export const ItineraryProvider = ({ children }) => {
    const [itineraries, setItineraries] = useState([]);

    // Load itineraries from localStorage on mount
    useEffect(() => {
        try {
            const savedItineraries = localStorage.getItem('itineraries');
            if (savedItineraries) {
                setItineraries(JSON.parse(savedItineraries));
            }
        } catch (error) {
            console.error('Error loading itineraries from localStorage:', error);
        }
    }, []);

    // Save itineraries to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('itineraries', JSON.stringify(itineraries));
        } catch (error) {
            console.error('Error saving itineraries to localStorage:', error);
        }
    }, [itineraries]);

    const addItinerary = (itinerary) => {
        const newItinerary = {
            id: Date.now().toString(),
            ...itinerary,
            createdAt: new Date().toISOString()
        };
        setItineraries(prev => [newItinerary, ...prev]);
        return newItinerary;
    };

    const updateItinerary = (id, updates) => {
        setItineraries(prev =>
            prev.map(it => it.id === id ? { ...it, ...updates } : it)
        );
    };

    const deleteItinerary = (id) => {
        setItineraries(prev => prev.filter(it => it.id !== id));
    };

    const getItinerary = (id) => {
        return itineraries.find(it => it.id === id);
    };

    return (
        <ItineraryContext.Provider value={{ itineraries, addItinerary, updateItinerary, deleteItinerary, getItinerary }}>
            {children}
        </ItineraryContext.Provider>
    );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (!context) {
        throw new Error('useItinerary must be used within ItineraryProvider');
    }
    return context;
};
