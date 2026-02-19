import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);
    const [splits, setSplits] = useState([]);

    // Load expenses from localStorage and MongoDB on mount
    useEffect(() => {
        try {
            const savedExpenses = localStorage.getItem('expenses');
            if (savedExpenses) {
                setExpenses(JSON.parse(savedExpenses));
            }
        } catch (error) {
            console.error('Error loading expenses from localStorage:', error);
        }

        // Try to fetch from backend
        try {
            api.get('/expenses').then(response => {
                if (response.data.success && response.data.data.length > 0) {
                    setExpenses(response.data.data);
                }
            }).catch(err => console.warn('Could not fetch expenses from backend:', err));
        } catch (error) {
            console.warn('Backend expenses fetch failed:', error);
        }
    }, []);

    // Save expenses to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('expenses', JSON.stringify(expenses));
        } catch (error) {
            console.error('Error saving expenses to localStorage:', error);
        }
    }, [expenses]);

    const addExpense = (expense) => {
        const newExpense = {
            id: Date.now().toString(),
            ...expense,
            createdAt: new Date().toISOString(),
            splits: expense.splitAmong || []
        };
        setExpenses([newExpense, ...expenses]);

        // Try to save to backend
        try {
            api.post('/expenses/add', newExpense).catch(err =>
                console.warn('Could not save expense to backend:', err)
            );
        } catch (error) {
            console.warn('Backend expense save failed:', error);
        }

        return newExpense;
    };

    const deleteExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
        setSplits(splits.filter(s => s.expenseId !== id));

        // Try to delete from backend
        try {
            api.delete(`/expenses/${id}/delete`).catch(err =>
                console.warn('Could not delete expense from backend:', err)
            );
        } catch (error) {
            console.warn('Backend expense delete failed:', error);
        }
    };

    const updateExpense = (id, updates) => {
        setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e));

        // Call backend
        api.put(`/expenses/${id}/update`, updates).catch(err =>
            console.warn('Could not update expense in backend:', err)
        );
    };

    const getExpense = (id) => {
        return expenses.find(e => e.id === id);
    };

    const getExpensesByItinerary = (itineraryId) => {
        return expenses.filter(e => String(e.itineraryId) === String(itineraryId));
    };

    const calculateSplits = (itineraryId, travelers) => {
        const itineraryExpenses = getExpensesByItinerary(itineraryId);
        const totalAmount = itineraryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const splits = {};
        travelers.forEach(traveler => {
            splits[traveler] = 0;
        });

        itineraryExpenses.forEach(expense => {
            const splitAmount = expense.amount / (expense.splitAmong?.length || 1);
            (expense.splitAmong || []).forEach(traveler => {
                splits[traveler] = (splits[traveler] || 0) + splitAmount;
            });
        });

        return { totalAmount, splits };
    };

    const getSettlements = (itineraryId, travelers, paidBy) => {
        const { splits } = calculateSplits(itineraryId, travelers);
        const totalPerPerson = Object.values(splits).reduce((a, b) => a + b, 0) / travelers.length;

        const settlements = [];
        Object.entries(splits).forEach(([person, amount]) => {
            const diff = amount - totalPerPerson;
            if (diff > 0.01) {
                settlements.push({ from: person, amount: diff.toFixed(2) });
            } else if (diff < -0.01) {
                settlements.push({ to: person, amount: Math.abs(diff).toFixed(2) });
            }
        });

        return settlements;
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            addExpense,
            deleteExpense,
            updateExpense,
            getExpense,
            getExpensesByItinerary,
            calculateSplits,
            getSettlements
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

export const useExpense = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpense must be used within ExpenseProvider');
    }
    return context;
};
