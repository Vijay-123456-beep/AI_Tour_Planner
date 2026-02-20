import api from './api';

export const itineraryService = {
    // Create a new itinerary
    createItinerary: async (itineraryData) => {
        try {
            const response = await api.post('/itinerary/create', {
                destination: itineraryData.destination,
                source: itineraryData.source || '',
                start_date: itineraryData.startDate,
                end_date: itineraryData.endDate,
                budget: parseFloat(itineraryData.budget),
                interests: itineraryData.interests || [],
                travelers: itineraryData.travelers || 1,
                interests: itineraryData.interests || [],
                travelers: itineraryData.travelers || 1,
                description: itineraryData.description || '',
                creator_email: itineraryData.creator_email || itineraryData.creatorEmail
            });
            return response.data.data;
        } catch (error) {
            console.error('Error creating itinerary:', error);
            throw error;
        }
    },

    // Get all user itineraries
    getUserItineraries: async () => {
        try {
            const response = await api.get('/itinerary/');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching itineraries:', error);
            throw error;
        }
    },

    // Get a specific itinerary
    getItinerary: async (itineraryId) => {
        try {
            const response = await api.get(`/itinerary/${itineraryId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching itinerary:', error);
            throw error;
        }
    },

    // Update an itinerary
    updateItinerary: async (itineraryId, updateData) => {
        try {
            const response = await api.put(`/itinerary/${itineraryId}/update`, updateData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating itinerary:', error);
            throw error;
        }
    },

    // Delete an itinerary
    deleteItinerary: async (itineraryId) => {
        try {
            const response = await api.delete(`/itinerary/${itineraryId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error deleting itinerary:', error);
            throw error;
        }
    },

    // Get itinerary statistics
    getItineraryStats: async (itineraryId) => {
        try {
            const response = await api.get(`/itinerary/${itineraryId}/stats`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching itinerary stats:', error);
            throw error;
        }
    }
};
