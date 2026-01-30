import api from './api';

export const expenseService = {
    // Get all expenses for an itinerary
    getItineraryExpenses: async (itineraryId) => {
        try {
            const response = await api.get(`/expenses/itinerary/${itineraryId}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    },

    // Add a new expense
    addExpense: async (expenseData) => {
        try {
            const response = await api.post('/expenses/add', {
                itinerary_id: expenseData.itineraryId,
                description: expenseData.description,
                amount: expenseData.amount,
                category: expenseData.category,
                paid_by: expenseData.paidBy,
                split_among: expenseData.splitAmong || [],
                notes: expenseData.notes || ''
            });
            return response.data.data;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    },

    // Delete an expense
    deleteExpense: async (expenseId) => {
        try {
            const response = await api.delete(`/expenses/${expenseId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },

    // Update an expense
    updateExpense: async (expenseId, updateData) => {
        try {
            const response = await api.put(`/expenses/${expenseId}`, updateData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },

    // Calculate splits for an itinerary
    calculateSplits: async (itineraryId, travelersCount) => {
        try {
            const response = await api.get(`/expenses/split-calculation/${itineraryId}`, {
                params: {
                    travelers_count: travelersCount
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error calculating splits:', error);
            throw error;
        }
    },

    // Get category summary
    getCategorySummary: async (itineraryId) => {
        try {
            const response = await api.get(`/expenses/category-summary/${itineraryId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching category summary:', error);
            throw error;
        }
    }
};
