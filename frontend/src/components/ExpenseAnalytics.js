import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const ExpenseAnalytics = ({ expenses, budget }) => {
    // 1. Prepare Data for Pie Chart (Expenses by Category)
    const categoryData = expenses.reduce((acc, curr) => {
        const category = curr.category || 'Other';
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += parseFloat(curr.amount || 0);
        return acc;
    }, {});

    const pieData = Object.keys(categoryData).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: categoryData[key]
    }));

    // Colors for the Pie Chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

    // 2. Prepare Data for Bar Chart (Total vs Budget)
    const totalSpent = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const remaining = Math.max(0, budget - totalSpent);

    const barData = [
        { name: 'Spent', amount: totalSpent },
        { name: 'Remaining', amount: remaining }
    ];

    if (expenses.length === 0) {
        return null;
    }

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Pie Chart: Expenses by Category */}
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Bar Chart: Budget Overview */}
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Budget Overview</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis prefix="$" />
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Bar dataKey="amount" fill="#82ca9d">
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#FF8042' : '#00C49F'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
                            Total Budget: ${budget} | Spent: ${totalSpent.toFixed(2)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default ExpenseAnalytics;
