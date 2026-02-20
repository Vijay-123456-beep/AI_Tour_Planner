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

    /**
     * Scan a receipt image using mock AI OCR
     */
    scanReceipt: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/ai/receipt-ocr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to scan receipt';
        }
    },

    /**
     * Get a VR descriptive preview for an experience
     */
    getVRPreview: async (destination, experience) => {
        try {
            const response = await api.post('/ai/vr-preview', {
                destination,
                experience,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get VR preview';
        }
    },

    /**
     * Get local food recommendations based on dietary restrictions
     */
    getFoodieRecommendations: async (location, restrictions = []) => {
        try {
            const response = await api.post('/ai/foodie-finder', {
                location,
                restrictions,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get foodie recommendations';
        }
    },

    /**
     * Collect a digital passport stamp for a landmark
     */
    collectStamp: async (landmark) => {
        try {
            const response = await api.post('/ai/collect-stamp', {
                landmark,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to collect stamp';
        }
    },

    /**
     * Get emergency assistance and local rescue info
     */
    getEmergencyHelp: async (location, situation) => {
        try {
            const response = await api.post('/ai/emergency-help', {
                location,
                situation,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get emergency help';
        }
    },

    /**
     * Translate text to a target language
     */
    translateText: async (text, targetLang) => {
        try {
            const response = await api.post('/ai/translate', {
                text,
                target_lang: targetLang,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to translate text';
        }
    },

    /**
     * Get travel buddy matches based on interests
     */
    getBuddyMatches: async (interests = [], travelStyle = 'balanced') => {
        try {
            const response = await api.post('/ai/buddy-match', {
                interests,
                travel_style: travelStyle,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to find buddy matches';
        }
    },

    /**
     * Get a story-driven narrative summary of a trip
     */
    getTripNarrative: async (destination, activities = []) => {
        try {
            const response = await api.post('/ai/trip-summary-narrative', {
                destination,
                activities,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get trip narrative';
        }
    },

    /**
     * Get sustainability eco-score for a trip
     */
    getEcoScore: async (destination, transportType) => {
        try {
            const response = await api.post('/ai/eco-score', {
                destination,
                transport_type: transportType,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get eco-score';
        }
    },

    /**
     * Get cultural etiquette and advice for a destination
     */
    getCulturalAdvice: async (destination) => {
        try {
            const response = await api.post('/ai/cultural-compass', {
                destination,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to get cultural advice';
        }
    },
};

export { aiService };
