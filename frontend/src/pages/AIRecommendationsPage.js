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
import { itineraryService } from '../services/itineraryService';
import { useItinerary } from '../contexts/ItineraryContext';
import { useSnackbar } from '../contexts/SnackbarContext';

const AIRecommendationsPage = () => {
    const { showSnackbar } = useSnackbar();
    const { addItinerary } = useItinerary();
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

    // Cultural Compass state
    const [culturalInputs, setCulturalInputs] = useState({
        destination: '',
    });
    const [culturalAdvice, setCulturalAdvice] = useState(null);

    // Eco-Score state
    const [ecoInputs, setEcoInputs] = useState({
        destination: '',
        transportType: 'car',
    });
    const [ecoScore, setEcoScore] = useState(null);

    // Translation state
    const [translationInputs, setTranslationInputs] = useState({
        text: '',
        targetLang: 'French',
    });
    const [translatedText, setTranslatedText] = useState('');

    // Foodie Finder state
    const [foodieInputs, setFoodieInputs] = useState({
        location: '',
        restrictions: [],
    });
    const [foodieRecs, setFoodieRecs] = useState(null);

    // VR Preview state
    const [vrInputs, setVrInputs] = useState({
        destination: '',
        experience: 'Scenic Market Walk',
    });
    const [vrScene, setVrScene] = useState(null);

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

    const handleSaveItinerary = async () => {
        if (!generatedItinerary) return;

        try {
            setLoading(true);
            const itineraryData = {
                destination: generationInputs.destination,
                start_date: generationInputs.startDate,
                end_date: generationInputs.endDate,
                budget: generationInputs.budget,
                interests: generationInputs.interests,
                travelers: generationInputs.travelers,
                description: generatedItinerary.summary || `Trip to ${generationInputs.destination}`,
                daily_plan: generatedItinerary.itinerary || [],
                creator_email: localStorage.getItem('userEmail')
            };

            const savedItinerary = await itineraryService.createItinerary(itineraryData);

            // Add to context immediately for UI update
            addItinerary({
                ...savedItinerary,
                startDate: savedItinerary.start_date,
                endDate: savedItinerary.end_date,
                creatorEmail: savedItinerary.creator_email
            });

            showSnackbar('Itinerary saved to your dashboard!', 'success');
        } catch (error) {
            console.error('Error saving itinerary:', error);
            showSnackbar('Failed to save itinerary', 'error');
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

    // Handle cultural advice
    const handleGetCulturalAdvice = async (e) => {
        e.preventDefault();
        if (!culturalInputs.destination) {
            showSnackbar('Please enter a destination', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await aiService.getCulturalAdvice(culturalInputs.destination);
            setCulturalAdvice(result);
            showSnackbar('Cultural advice generated!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle eco-score
    const handleGetEcoScore = async (e) => {
        e.preventDefault();
        if (!ecoInputs.destination) {
            showSnackbar('Please enter a destination', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await aiService.getEcoScore(ecoInputs.destination, ecoInputs.transportType);
            setEcoScore(result);
            showSnackbar('Eco-score calculated!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle translation
    const handleTranslate = async (e) => {
        e.preventDefault();
        if (!translationInputs.text) return;

        setLoading(true);
        try {
            const result = await aiService.translateText(translationInputs.text, translationInputs.targetLang);
            setTranslatedText(result.translated_text);
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle foodie recommendations
    const handleGetFoodieRecs = async (e) => {
        e.preventDefault();
        if (!foodieInputs.location) {
            showSnackbar('Please enter a location', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await aiService.getFoodieRecommendations(foodieInputs.location, foodieInputs.restrictions);
            setFoodieRecs(result.recommendations);
            showSnackbar('Foodie recommendations found!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle VR preview
    const handleVRPreview = async (e) => {
        e.preventDefault();
        if (!vrInputs.destination) {
            showSnackbar('Please enter a destination', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await aiService.getVRPreview(vrInputs.destination, vrInputs.experience);
            setVrScene(result);
            showSnackbar('VR Scene generated!', 'success');
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
                <Button
                    variant={activeTab === 'cultural' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('cultural')}
                >
                    Cultural Compass
                </Button>
                <Button
                    variant={activeTab === 'eco' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('eco')}
                >
                    Eco-Trip
                </Button>
                <Button
                    variant={activeTab === 'translate' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('translate')}
                >
                    Whisper Translate
                </Button>
                <Button
                    variant={activeTab === 'foodie' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('foodie')}
                >
                    Foodie Finder
                </Button>
                <Button
                    variant={activeTab === 'vr' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('vr')}
                >
                    VR Preview
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
                                                            Est. Cost: ₹{typeof rec?.estimated_cost === 'number' ? rec.estimated_cost.toLocaleString() : (rec?.estimated_cost || 0).toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            Best Season: {(rec.best_season || []).join(', ')}
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Generated Itinerary: {generatedItinerary.destination}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleSaveItinerary}
                                        disabled={loading}
                                    >
                                        Save to My Itineraries
                                    </Button>
                                </Box>
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Duration</Typography>
                                                <Typography variant="h6">{generatedItinerary.duration_days} days</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Total Budget</Typography>
                                                <Typography variant="h6">₹{generatedItinerary?.total_budget?.toLocaleString() || '0'}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">AI Score</Typography>
                                                <Typography variant="h6">{generatedItinerary.ai_score}/100</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Budget Utilization</Typography>
                                                <Typography variant="h6">{generatedItinerary.statistics?.budget_utilization || 0}%</Typography>
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
                                                <Typography variant="h6">₹{optimizationResult?.current_budget?.toLocaleString() || '0'}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography color="textSecondary">Recommended Budget</Typography>
                                                <Typography variant="h6">₹{optimizationResult?.minimum_recommended_budget?.toLocaleString() || '0'}</Typography>
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
                                            {optimizationResult?.cost_breakdown && Object.entries(optimizationResult.cost_breakdown).map(([category, amount]) => (
                                                <TableRow key={category}>
                                                    <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                                                    <TableCell align="right">₹{amount?.toLocaleString() || '0'}</TableCell>
                                                    <TableCell align="right">
                                                        {optimizationResult.current_budget > 0
                                                            ? ((amount / optimizationResult.current_budget) * 100).toFixed(1)
                                                            : '0.0'}%
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
            {/* Tab 4: Cultural Compass */}
            {activeTab === 'cultural' && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Cultural Insights
                            </Typography>
                            <Box component="form" onSubmit={handleGetCulturalAdvice} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Destination"
                                    value={culturalInputs.destination}
                                    onChange={(e) =>
                                        setCulturalInputs({ ...culturalInputs, destination: e.target.value })
                                    }
                                    placeholder="e.g., Tokyo, Japan"
                                />
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : 'Get Cultural Advice'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {culturalAdvice && (
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                    🌍 Cultural Guide for {culturalAdvice.destination}
                                </Typography>

                                <Grid container spacing={2}>
                                    {[
                                        { title: '🤝 Etiquette', data: culturalAdvice.etiquette, color: '#e3f2fd' },
                                        { title: '👗 Dress Code', data: culturalAdvice.dress_code, color: '#f3e5f5' },
                                        { title: '💵 Tipping', data: culturalAdvice.tipping, color: '#e8f5e9' },
                                        { title: '🚫 Taboos', data: culturalAdvice.taboos, color: '#fff3e0' },
                                    ].map((section, idx) => (
                                        <Grid item xs={12} sm={6} key={idx}>
                                            <Card sx={{ height: '100%', bgcolor: section.color }}>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>{section.title}</Typography>
                                                    <Box component="ul" sx={{ pl: 2 }}>
                                                        {section.data && section.data.map((item, i) => (
                                                            <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                                                                {item}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}
            {/* Tab 5: Eco-Trip Sustainability Score */}
            {activeTab === 'eco' && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Sustainability Checker
                            </Typography>
                            <Box component="form" onSubmit={handleGetEcoScore} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Destination"
                                    value={ecoInputs.destination}
                                    onChange={(e) =>
                                        setEcoInputs({ ...ecoInputs, destination: e.target.value })
                                    }
                                    placeholder="e.g., Bali, Indonesia"
                                />
                                <TextField
                                    fullWidth
                                    select
                                    label="Transport Mode"
                                    value={ecoInputs.transportType}
                                    onChange={(e) => setEcoInputs({ ...ecoInputs, transportType: e.target.value })}
                                >
                                    {['car', 'bus', 'train', 'airplane', 'bike'].map(type => (
                                        <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>{type}</MenuItem>
                                    ))}
                                </TextField>
                                <Button type="submit" variant="contained" color="success" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : 'Calculate Eco-Score'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {ecoScore && (
                            <Box>
                                <Card sx={{ mb: 3, bgcolor: '#e8f5e9' }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                🌿 Sustainability Score
                                            </Typography>
                                            <Chip
                                                label={`${ecoScore.rating}/10`}
                                                color={ecoScore.rating >= 7 ? 'success' : (ecoScore.rating >= 4 ? 'warning' : 'error')}
                                                sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 2 }}
                                            />
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            Estimated CO2 Impact: <strong>{ecoScore.co2_kg} kg</strong>
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Typography variant="h6" gutterBottom>♻️ Green Alternatives & Tips</Typography>
                                <Grid container spacing={2}>
                                    {ecoScore.alternatives && ecoScore.alternatives.map((tip, idx) => (
                                        <Grid item xs={12} key={idx}>
                                            <Alert severity="success" icon={false}>
                                                {tip}
                                            </Alert>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}
            {/* Tab 6: Live Translation Whisper */}
            {activeTab === 'translate' && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                🎙️ Live Translation "Whisper"
                            </Typography>
                            <Box component="form" onSubmit={handleTranslate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Text to Translate"
                                    multiline
                                    rows={4}
                                    value={translationInputs.text}
                                    onChange={(e) =>
                                        setTranslationInputs({ ...translationInputs, text: e.target.value })
                                    }
                                    placeholder="e.g., Where is the nearest train station?"
                                />
                                <TextField
                                    fullWidth
                                    select
                                    label="Target Language"
                                    value={translationInputs.targetLang}
                                    onChange={(e) => setTranslationInputs({ ...translationInputs, targetLang: e.target.value })}
                                >
                                    {['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic'].map(lang => (
                                        <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                                    ))}
                                </TextField>
                                <Button type="submit" variant="contained" disabled={loading || !translationInputs.text}>
                                    {loading ? <CircularProgress size={24} /> : 'Translate Now'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom color="text.secondary">
                                Translation
                            </Typography>
                            {translatedText ? (
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="h4" align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        {translatedText}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <Typography variant="body1">Your translation will appear here.</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Tab 7: AI Foodie Finder */}
            {activeTab === 'foodie' && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                🍲 AI Foodie Finder
                            </Typography>
                            <Box component="form" onSubmit={handleGetFoodieRecs} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Location"
                                    value={foodieInputs.location}
                                    onChange={(e) =>
                                        setFoodieInputs({ ...foodieInputs, location: e.target.value })
                                    }
                                    placeholder="e.g., Tokyo, Japan"
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Dietary Restrictions</InputLabel>
                                    <Select
                                        multiple
                                        value={foodieInputs.restrictions}
                                        onChange={(e) => setFoodieInputs({ ...foodieInputs, restrictions: e.target.value })}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {['Vegetarian', 'Vegan', 'Non-Veg', 'Non-Vegetarian', 'Dairy-Free', 'Egg-Free', 'Sea-Food', 'Keto', 'Gluten-Free', 'Nut-Free', 'Halal', 'Kosher'].map(res => (
                                            <MenuItem key={res} value={res}>{res}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button type="submit" variant="contained" color="secondary" disabled={loading || !foodieInputs.location}>
                                    {loading ? <CircularProgress size={24} /> : 'Find Safe Eats 🍕'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {foodieRecs ? (
                            <Grid container spacing={2}>
                                {foodieRecs.map((dish, idx) => (
                                    <Grid item xs={12} sm={6} key={idx}>
                                        <Card sx={{ height: '100%' }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="h6" color="primary">{dish.name}</Typography>
                                                    <Chip
                                                        label={dish.safety}
                                                        color={dish.safety.toLowerCase().includes('safe') ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    {dish.description}
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                    {dish.ingredients.map(ing => (
                                                        <Chip key={ing} label={ing} variant="outlined" size="small" />
                                                    ))}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Paper sx={{ p: 10, textAlign: 'center', opacity: 0.6 }}>
                                <Typography>What are you craving today?</Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* Tab 8: VR Pre-Trip Preview */}
            {activeTab === 'vr' && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                🥽 VR Pre-Trip Preview
                            </Typography>
                            <Box component="form" onSubmit={handleVRPreview} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Destination"
                                    value={vrInputs.destination}
                                    onChange={(e) =>
                                        setVrInputs({ ...vrInputs, destination: e.target.value })
                                    }
                                    placeholder="e.g., Kyoto, Bali, Rome"
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Experience Type</InputLabel>
                                    <Select
                                        value={vrInputs.experience}
                                        onChange={(e) => setVrInputs({ ...vrInputs, experience: e.target.value })}
                                        label="Experience Type"
                                    >
                                        <MenuItem value="Scenic Market Walk">Scenic Market Walk</MenuItem>
                                        <MenuItem value="Rooftop Sunset">Rooftop Sunset</MenuItem>
                                        <MenuItem value="Nature Soundscape">Nature Soundscape</MenuItem>
                                        <MenuItem value="Cultural Ceremony">Cultural Ceremony</MenuItem>
                                        <MenuItem value="Street Food Tour">Street Food Tour</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button type="submit" variant="contained" color="primary" disabled={loading || !vrInputs.destination}>
                                    {loading ? <CircularProgress size={24} /> : 'Generate VR Scene 🌌'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {vrScene ? (
                            <Paper sx={{
                                p: 0,
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: '1px solid #ddd',
                                backgroundImage: 'linear-gradient(to bottom, #000428, #004e92)',
                                color: 'white'
                            }}>
                                <Box sx={{ p: 4 }}>
                                    <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                                        IMMERSIVE PREVIEW: {vrScene.experience}
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="overline" sx={{ color: '#00d2ff' }}>👁️ Visuals</Typography>
                                            <Typography variant="body1" paragraph>{vrScene.visuals}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="overline" sx={{ color: '#00d2ff' }}>👂 Sounds</Typography>
                                            <Typography variant="body1" paragraph>{vrScene.sounds}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="overline" sx={{ color: '#00d2ff' }}>🌬️ Atmosphere</Typography>
                                            <Typography variant="body1" paragraph>{vrScene.atmosphere}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="overline" sx={{ color: '#00d2ff' }}>💡 Immersive Tip</Typography>
                                            <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>{vrScene.tip}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                    <Typography variant="caption">Virtual Reality Simulation Engine powered by AI</Typography>
                                </Box>
                            </Paper>
                        ) : (
                            <Paper sx={{ p: 10, textAlign: 'center', opacity: 0.6, bgcolor: '#f0f0f0' }}>
                                <Typography variant="h6">Step into the future.</Typography>
                                <Typography color="text.secondary">Enter a destination to generate an immersive preview.</Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default AIRecommendationsPage;
