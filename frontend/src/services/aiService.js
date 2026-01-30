import api from './api';

const aiService = {
    /**
     * Generate an AI-powered itinerary
     */
    generateItinerary: async (destination, startDate, endDate, budget, interests, travelers, travelStyle = 'balanced') => {
        try {
            const response = await api.post('/ai/generate-itinerary', {
                destination,
                start_date: startDate,
                end_date: endDate,
                budget: parseFloat(budget),
                interests: interests || [],
                travelers: parseInt(travelers),
                travel_style: travelStyle,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to generate itinerary';
        }
    },

    /**
     * Get destination recommendations
     */
    getDestinationRecommendations: async (interests, budget, travelers, tripDuration) => {
        try {
            const response = await api.post('/ai/recommend-destinations', {
                interests: interests || [],
                budget: parseFloat(budget),
                travelers: parseInt(travelers),
                trip_duration: parseInt(tripDuration),
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get recommendations';
        }
    },

    /**
     * Get budget optimization recommendations
     */
    optimizeBudget: async (destination, travelers, tripDuration, currentBudget, constraints = []) => {
        try {
            const response = await api.post('/ai/optimize-budget', {
                destination,
                travelers: parseInt(travelers),
                trip_duration: parseInt(tripDuration),
                current_budget: parseFloat(currentBudget),
                constraints,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to optimize budget';
        }
    },

    /**
     * Get activity suggestions for a destination
     */
    getActivitySuggestions: async (destination, interests = [], budget = '10000') => {
        try {
            const interestsParam = interests.join(',');
            const response = await api.get('/ai/activity-suggestions', {
                params: {
                    destination,
                    interests: interestsParam,
                    budget,
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get activity suggestions';
        }
    },
};

export { aiService };
