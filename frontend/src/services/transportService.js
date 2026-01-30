import api from './api';

export const transportService = {
    // Get available transport options for a destination
    getTransportOptions: async (destination, startDate, endDate, travelers) => {
        try {
            const response = await api.get('/transport/options', {
                params: {
                    destination,
                    start_date: startDate,
                    end_date: endDate,
                    travelers
                }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching transport options:', error);
            throw error;
        }
    },

    // Book a transport
    bookTransport: async (itineraryId, providerId, startDate, endDate, travelers, price, description = '') => {
        try {
            const response = await api.post('/transport/book', {
                itinerary_id: itineraryId,
                provider_id: providerId,
                start_date: startDate,
                end_date: endDate,
                travelers,
                price,
                description
            });
            return response.data.data;
        } catch (error) {
            console.error('Error booking transport:', error);
            throw error;
        }
    },

    // Get user's transport bookings
    getUserBookings: async () => {
        try {
            const response = await api.get('/transport/bookings');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    },

    // Get booking details
    getBookingDetails: async (bookingId) => {
        try {
            const response = await api.get(`/transport/bookings/${bookingId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching booking details:', error);
            throw error;
        }
    },

    // Get bookings for a specific itinerary
    getItineraryBookings: async (itineraryId) => {
        try {
            const response = await api.get(`/transport/itinerary/${itineraryId}/bookings`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching itinerary bookings:', error);
            throw error;
        }
    },

    // Delete a booking
    deleteBooking: async (bookingId) => {
        try {
            const response = await api.delete(`/transport/${bookingId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error deleting booking:', error);
            throw error;
        }
    },

    // Update a booking
    updateBooking: async (bookingId, updateData) => {
        try {
            const response = await api.put(`/transport/${bookingId}`, updateData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    }
};
