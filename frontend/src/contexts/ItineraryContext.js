import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ItineraryContext = createContext();

export const ItineraryProvider = ({ children }) => {
    const [itineraries, setItineraries] = useState([]);

    // Load itineraries from backend on mount
    useEffect(() => {
        const fetchItineraries = async () => {
            try {
                const response = await api.get('/itinerary/');
                if (response.data.success) {
                    // Check if server returned empty list but we have local data
                    // This happens when dev server restarts and wipes memory
                    const serverData = response.data.data;
                    const localData = localStorage.getItem('itineraries');

                    if (serverData.length === 0 && localData) {
                        try {
                            const parsedLocal = JSON.parse(localData);
                            if (parsedLocal.length > 0) {
                                console.warn('Server empty, restoring from localStorage');
                                setItineraries(parsedLocal);
                                // Optional: Re-sync to server could happen here
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing local data:', e);
                        }
                    }

                    setItineraries(serverData);
                }
            } catch (error) {
                console.error('Error loading itineraries from backend:', error);

                // Fallback to localStorage
                try {
                    const savedItineraries = localStorage.getItem('itineraries');
                    if (savedItineraries) {
                        setItineraries(JSON.parse(savedItineraries));
                    }
                } catch (e) {
                    console.error('Error loading from localStorage:', e);
                }
            }
        };

        fetchItineraries();
    }, []);

    // Also update localStorage as a cache when itineraries change
    useEffect(() => {
        try {
            localStorage.setItem('itineraries', JSON.stringify(itineraries));
        } catch (error) {
            console.error('Error saving itineraries to localStorage:', error);
        }
    }, [itineraries]);

    const addItinerary = (itinerary) => {
        // Optimistic update
        const newItinerary = {
            id: itinerary.id || Date.now().toString(),
            ...itinerary,
            createdAt: new Date().toISOString()
        };
        setItineraries(prev => [newItinerary, ...prev]);

        // No need to call API here as it's handled in the component via itineraryService
        // But we should refresh the list to get the server-generated ID if needed
        return newItinerary;
    };

    const updateItinerary = (id, updates) => {
        setItineraries(prev =>
            prev.map(it => String(it.id) === String(id) ? { ...it, ...updates } : it)
        );

        // Call backend
        api.put(`/itinerary/${id}/update`, updates).catch(err =>
            console.error('Error updating itinerary in backend:', err)
        );
    };

    const deleteItinerary = (id) => {
        setItineraries(prev => prev.filter(it => String(it.id) !== String(id)));

        // Call backend
        api.delete(`/itinerary/${id}/delete`).catch(err =>
            console.error('Error deleting itinerary from backend:', err)
        );
    };

    const getItinerary = (id) => {
        return itineraries.find(it => String(it.id) === String(id));
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
