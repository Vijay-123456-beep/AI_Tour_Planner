import React, { useState, useContext } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { aiService } from '../services/aiService';
import { SnackbarContext } from '../contexts/SnackbarContext';

const AIRecommendationsPage = () => {
    const { showSnackbar } = useContext(SnackbarContext);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('recommendations'); // recommendations, generate, optimize

    // Recommendation state
    const [recommendationInputs, setRecommendationInputs] = useState({
        interests: [],
        budget: '50000',
        travelers: '1',
        tripDuration: '3',
    });
    const [recommendations, setRecommendations] = useState(null);

    // Generation state
    const [generationInputs, setGenerationInputs] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        budget: '50000',
        interests: [],
        travelers: '1',
        travelStyle: 'balanced',
    });
    const [generatedItinerary, setGeneratedItinerary] = useState(null);

    // Optimization state
    const [optimizationInputs, setOptimizationInputs] = useState({
        destination: '',
        travelers: '1',
        tripDuration: '3',
        currentBudget: '50000',
    });
    const [optimizationResult, setOptimizationResult] = useState(null);

    const interestOptions = [
        'trekking',
        'culture',
        'nature',
        'adventure',
        'leisure',
        'history',
        'wildlife',
    ];

    // Handle destination recommendations
    const handleGetRecommendations = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await aiService.getDestinationRecommendations(
                recommendationInputs.interests,
                recommendationInputs.budget,
                recommendationInputs.travelers,
                recommendationInputs.tripDuration
            );

            setRecommendations(result);
            showSnackbar('Recommendations generated successfully!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle itinerary generation
    const handleGenerateItinerary = async (e) => {
        e.preventDefault();

        if (!generationInputs.destination || !generationInputs.startDate || !generationInputs.endDate) {
            showSnackbar('Please fill in destination and dates', 'error');
            return;
        }

        setLoading(true);

        try {
            const result = await aiService.generateItinerary(
                generationInputs.destination,
                generationInputs.startDate,
                generationInputs.endDate,
                generationInputs.budget,
                generationInputs.interests,
                generationInputs.travelers,
                generationInputs.travelStyle
            );

            setGeneratedItinerary(result);
            showSnackbar('Itinerary generated successfully!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle budget optimization
    const handleOptimizeBudget = async (e) => {
        e.preventDefault();

        if (!optimizationInputs.destination) {
            showSnackbar('Please enter a destination', 'error');
            return;
        }

        setLoading(true);

        try {
            const result = await aiService.optimizeBudget(
                optimizationInputs.destination,
                optimizationInputs.travelers,
                optimizationInputs.tripDuration,
                optimizationInputs.currentBudget
            );

            setOptimizationResult(result);
            showSnackbar('Budget optimization completed!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                🤖 AI-Powered Travel Recommendations
            </Typography>

            {/* Tab Navigation */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                <Button
                    variant={activeTab === 'recommendations' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('recommendations')}
                >
                    Destination Recommendations
                </Button>
                <Button
                    variant={activeTab === 'generate' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('generate')}
                >
                    Generate Itinerary
                </Button>
                <Button
                    variant={activeTab === 'optimize' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('optimize')}
                >
                    Budget Optimizer
                </Button>
            </Box>

            {/* Tab 1: Destination Recommendations */}
            {activeTab === 'recommendations' && (
                <Grid container spacing={3}>
                    {/* Input Form */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Find Your Destination
                            </Typography>
                            <Box component="form" onSubmit={handleGetRecommendations} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Interests</InputLabel>
                                    <Select
                                        multiple
                                        value={recommendationInputs.interests}
                                        onChange={(e) =>
                                            setRecommendationInputs({ ...recommendationInputs, interests: e.target.value })
                                        }
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {interestOptions.map((interest) => (
                                            <MenuItem key={interest} value={interest}>
                                                {interest}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    type="number"
                                    label="Budget (₹)"
                                    value={recommendationInputs.budget}
                                    onChange={(e) =>
                                        setRecommendationInputs({ ...recommendationInputs, budget: e.target.value })
                                    }
                                    inputProps={{ min: '5000', step: '1000' }}
                                />

                                <TextField
                                    type="number"
                                    label="Travelers"
                                    value={recommendationInputs.travelers}
                                    onChange={(e) =>
                                        setRecommendationInputs({ ...recommendationInputs, travelers: e.target.value })
                                    }
                                    inputProps={{ min: '1', max: '20' }}
                                />

                                <TextField
                                    type="number"
                                    label="Trip Duration (days)"
                                    value={recommendationInputs.tripDuration}
                                    onChange={(e) =>
                                        setRecommendationInputs({ ...recommendationInputs, tripDuration: e.target.value })
                                    }
                                    inputProps={{ min: '1', max: '30' }}
                                />

                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : 'Get Recommendations'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Recommendations Results */}
                    <Grid item xs={12} md={8}>
                        {recommendations && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Top Recommendations
                                </Typography>
                                {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                                            <Grid item xs={12} key={idx}>
                                                <Card>
                                                    <CardContent>
                                                        <Typography variant="h6">{rec.destination}</Typography>
                                                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                            <Chip
                                                                label={`Score: ${rec.score}`}
                                                                color={rec.score >= 75 ? 'success' : 'default'}
                                                            />
                                                            <Chip label={`Difficulty: ${rec.difficulty}`} />
                                                        </Box>
                                                        <Typography sx={{ mt: 1 }}>
                                                            Est. Cost: ₹{rec.estimated_cost.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            Best Season: {rec.best_season.join(', ')}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Alert severity="info">No recommendations found</Alert>
                                )}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Generate Itinerary */}
            {activeTab === 'generate' && (
                <Grid container spacing={3}>
                    {/* Input Form */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Generate Itinerary
                            </Typography>
                            <Box component="form" onSubmit={handleGenerateItinerary} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Destination"
                                    value={generationInputs.destination}
                                    onChange={(e) =>
                                        setGenerationInputs({ ...generationInputs, destination: e.target.value })
                                    }
                                    placeholder="e.g., Maredumilli Forest"
                                />

                                <TextField
                                    type="date"
                                    label="Start Date"
                                    value={generationInputs.startDate}
                                    onChange={(e) =>
                                        setGenerationInputs({ ...generationInputs, startDate: e.target.value })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    type="date"
                                    label="End Date"
                                    value={generationInputs.endDate}
                                    onChange={(e) =>
                                        setGenerationInputs({ ...generationInputs, endDate: e.target.value })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    type="number"
                                    label="Budget (₹)"
                                    value={generationInputs.budget}
                                    onChange={(e) =>
                                        setGenerationInputs({ ...generationInputs, budget: e.target.value })
                                    }
                                    inputProps={{ min: '5000' }}
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Interests</InputLabel>
                                    <Select
                                        multiple
                                        value={generationInputs.interests}
                                        onChange={(e) =>
                                            setGenerationInputs({ ...generationInputs, interests: e.target.value })
                                        }
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {interestOptions.map((interest) => (
                                            <MenuItem key={interest} value={interest}>
                                                {interest}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    type="number"
                                    label="Travelers"
                                    value={generationInputs.travelers}
                                    onChange={(e) =>
                                        setGenerationInputs({ ...generationInputs, travelers: e.target.value })
                                    }
                                    inputProps={{ min: '1' }}
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Travel Style</InputLabel>
                                    <Select
                                        value={generationInputs.travelStyle}
                                        onChange={(e) =>
                                            setGenerationInputs({ ...generationInputs, travelStyle: e.target.value })
                                        }
                                    >
                                        <MenuItem value="relaxed">Relaxed</MenuItem>
                                        <MenuItem value="balanced">Balanced</MenuItem>
                                        <MenuItem value="adventurous">Adventurous</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : 'Generate Itinerary'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Generated Itinerary */}
                    <Grid item xs={12} md={8}>
                        {generatedItinerary && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Generated Itinerary: {generatedItinerary.destination}
                                </Typography>
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Duration</Typography>
                                                <Typography variant="h6">{generatedItinerary.duration_days} days</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Total Budget</Typography>
                                                <Typography variant="h6">₹{generatedItinerary.total_budget.toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">AI Score</Typography>
                                                <Typography variant="h6">{generatedItinerary.ai_score}/100</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Budget Utilization</Typography>
                                                <Typography variant="h6">{generatedItinerary.statistics.budget_utilization}%</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Day by day schedule */}
                                {generatedItinerary.itinerary && generatedItinerary.itinerary.map((day, idx) => (
                                    <Card key={idx} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Typography variant="h6">
                                                Day {day.day} - {day.date}
                                            </Typography>
                                            {day.activities && day.activities.map((activity, aidx) => (
                                                <Box key={aidx} sx={{ mt: 1, pl: 2, borderLeft: '3px solid #1976d2' }}>
                                                    <Typography variant="body2">
                                                        <strong>{activity.name}</strong> ({activity.duration}h)
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Cost: ₹{activity.cost}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Budget Optimizer */}
            {activeTab === 'optimize' && (
                <Grid container spacing={3}>
                    {/* Input Form */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Optimize Your Budget
                            </Typography>
                            <Box component="form" onSubmit={handleOptimizeBudget} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Destination"
                                    value={optimizationInputs.destination}
                                    onChange={(e) =>
                                        setOptimizationInputs({ ...optimizationInputs, destination: e.target.value })
                                    }
                                    placeholder="e.g., Maredumilli Forest"
                                />

                                <TextField
                                    type="number"
                                    label="Travelers"
                                    value={optimizationInputs.travelers}
                                    onChange={(e) =>
                                        setOptimizationInputs({ ...optimizationInputs, travelers: e.target.value })
                                    }
                                    inputProps={{ min: '1' }}
                                />

                                <TextField
                                    type="number"
                                    label="Trip Duration (days)"
                                    value={optimizationInputs.tripDuration}
                                    onChange={(e) =>
                                        setOptimizationInputs({ ...optimizationInputs, tripDuration: e.target.value })
                                    }
                                    inputProps={{ min: '1' }}
                                />

                                <TextField
                                    type="number"
                                    label="Current Budget (₹)"
                                    value={optimizationInputs.currentBudget}
                                    onChange={(e) =>
                                        setOptimizationInputs({ ...optimizationInputs, currentBudget: e.target.value })
                                    }
                                    inputProps={{ min: '5000' }}
                                />

                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : 'Analyze Budget'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Optimization Results */}
                    <Grid item xs={12} md={8}>
                        {optimizationResult && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Budget Analysis
                                </Typography>
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Current Budget</Typography>
                                                <Typography variant="h6">₹{optimizationResult.current_budget.toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Recommended Budget</Typography>
                                                <Typography variant="h6">₹{optimizationResult.minimum_recommended_budget.toLocaleString()}</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Cost Breakdown */}
                                <Typography variant="h6" gutterBottom>
                                    Cost Breakdown
                                </Typography>
                                <TableContainer component={Paper} sx={{ mb: 2 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell>Category</TableCell>
                                                <TableCell align="right">Budget (₹)</TableCell>
                                                <TableCell align="right">Percentage</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(optimizationResult.cost_breakdown).map(([category, amount]) => (
                                                <TableRow key={category}>
                                                    <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                                                    <TableCell align="right">₹{amount.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        {((amount / optimizationResult.current_budget) * 100).toFixed(1)}%
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Recommendations */}
                                <Typography variant="h6" gutterBottom>
                                    Recommendations
                                </Typography>
                                {optimizationResult.recommendations && optimizationResult.recommendations.map((rec, idx) => (
                                    <Alert key={idx} severity="info" sx={{ mb: 1 }}>
                                        {rec}
                                    </Alert>
                                ))}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default AIRecommendationsPage;
