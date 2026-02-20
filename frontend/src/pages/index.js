import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
    Box, Typography, Button, Card, CardContent, Grid, Container,
    TextField, MenuItem, Paper, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert,
    Tabs, Tab, ListSubheader
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useItinerary } from '../contexts/ItineraryContext';
import { useTransport } from '../contexts/TransportContext';
import { useExpense } from '../contexts/ExpenseContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import EmptyStateIcon from '@mui/icons-material/LuggageOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import FlightIcon from '@mui/icons-material/Flight';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { fetchWeatherForecast, getWeatherRecommendations } from '../services/weatherService';
import { itineraryService } from '../services/itineraryService';
import api from '../services/api';
import ExpenseAnalytics from '../components/ExpenseAnalytics';
import ItineraryMap from '../components/ItineraryMap';
import { downloadItineraryPDF } from '../utils/pdfGenerator';
import DownloadIcon from '@mui/icons-material/Download';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { aiService } from '../services/aiService';
import CircularProgress from '@mui/material/CircularProgress';
import AIRecommendationsPage from './AIRecommendationsPage';

const ItineraryListPage = () => {
    const navigate = useNavigate();
    const { itineraries, deleteItinerary } = useItinerary();
    const [tabValue, setTabValue] = useState(0); // 0: My Itineraries, 1: Available Tours

    // Get current user email
    const userEmail = localStorage.getItem('userEmail');

    // Filter itineraries to show only active/future trips (endDate >= today)
    const today = new Date().toISOString().split('T')[0];
    const activeItineraries = itineraries.filter(it => it.endDate >= today);

    // Split into My Itineraries and Available Tours
    const myItineraries = activeItineraries.filter(it =>
        it.creatorEmail === userEmail || (!it.creatorEmail && !userEmail)
    );

    const availableTours = activeItineraries.filter(it =>
        it.creatorEmail && it.creatorEmail !== userEmail
    );

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this itinerary?')) {
            deleteItinerary(id);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const ItineraryCard = ({ itinerary, isOwner }) => (
        <Grid item xs={12} md={6} lg={4} key={itinerary.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" gutterBottom>
                            {itinerary.destination}
                        </Typography>
                        {!isOwner && (
                            <Chip label={`By ${itinerary.creatorEmail || 'Traveler'}`} size="small" variant="outlined" />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Dates:</strong> {itinerary.startDate} to {itinerary.endDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Budget:</strong> ₹{itinerary.budget}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Travelers:</strong> {itinerary.travelers}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {itinerary.interests.map(interest => (
                            <Chip key={interest} label={interest} size="small" />
                        ))}
                    </Box>
                </CardContent>
                <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', bgcolor: '#f5f5f5' }}>
                    <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                    >
                        View
                    </Button>
                    {isOwner && (
                        <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={() => handleDelete(itinerary.id)}
                        >
                            Delete
                        </Button>
                    )}
                </Box>
            </Card>
        </Grid>
    );

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
                <Typography variant="h4">Itineraries</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/itineraries/create')}
                >
                    Create Itinerary
                </Button>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" centered>
                    <Tab label={`My Itineraries (${myItineraries.length})`} />
                    <Tab label={`Available Tours (${availableTours.length})`} />
                </Tabs>
            </Paper>

            <Box role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                    myItineraries.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <EmptyStateIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No active itineraries found
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                                Start planning your next adventure!
                            </Typography>
                            <Button variant="contained" onClick={() => navigate('/itineraries/create')}>
                                Create Your First Itinerary
                            </Button>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {myItineraries.map(it => <ItineraryCard key={it.id} itinerary={it} isOwner={true} />)}
                        </Grid>
                    )
                )}
            </Box>

            <Box role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                    availableTours.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                                No public tours available yet.
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {availableTours.map(it => <ItineraryCard key={it.id} itinerary={it} isOwner={false} />)}
                        </Grid>
                    )
                )}
            </Box>
        </Container>
    );
};

const ItineraryDetailPage = () => {
    const { itineraries } = useItinerary();
    const { getExpensesByItinerary, calculateSplits } = useExpense();
    const { getBookingsByItinerary } = useTransport();
    const navigate = useNavigate();
    const [collaborationOpen, setCollaborationOpen] = useState(false);

    // Get ID from URL params using native method
    const urlId = window.location.pathname.split('/').pop();
    const itinerary = itineraries.find(it => String(it.id) === String(urlId));

    if (!itinerary) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', py: 12 }}>
                    <Typography variant="h6" color="error">Itinerary not found</Typography>
                    <Button onClick={() => navigate('/itineraries')} sx={{ mt: 2 }}>
                        Back to Itineraries
                    </Button>
                </Box>
            </Container>
        );
    }

    const expenses = getExpensesByItinerary(itinerary.id);
    const bookings = getBookingsByItinerary(itinerary.id);
    const { totalAmount } = calculateSplits(itinerary.id, itinerary.interests || []);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/itineraries')}
                    sx={{ mb: 3 }}
                >
                    Back to Itineraries
                </Button>

                {/* Itinerary Header */}
                <Card sx={{ mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h3" gutterBottom>
                                {itinerary.destination}
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadItineraryPDF(itinerary, expenses)}
                                sx={{ mt: 1 }}
                            >
                                Download PDF
                            </Button>
                        </Box>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Dates</Typography>
                                <Typography variant="h6">
                                    {itinerary.startDate} → {itinerary.endDate}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Budget</Typography>
                                <Typography variant="h6">₹{itinerary.budget}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Travelers</Typography>
                                <Typography variant="h6">{itinerary.travelers}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Total Expenses</Typography>
                                <Typography variant="h6">₹{totalAmount.toFixed(2)}</Typography>
                            </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
                            {(itinerary.interests || []).map(interest => (
                                <Chip key={interest} label={interest} />
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* Map Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <ItineraryMap
                            source={itinerary.source}
                            destination={itinerary.destination}
                            startDate={itinerary.startDate}
                            endDate={itinerary.endDate}
                        />
                    </CardContent>
                </Card>

                {/* Expenses Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Expenses ({expenses.length})</Typography>
                                    <Button variant="contained" size="small">Add Expense</Button>
                                </Box>
                                {expenses.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                    <TableCell>Category</TableCell>
                                                    <TableCell>Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {expenses.map(expense => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell>{expense.description}</TableCell>
                                                        <TableCell>₹{expense.amount}</TableCell>
                                                        <TableCell>{expense.category}</TableCell>
                                                        <TableCell>
                                                            <Button size="small" color="error">Delete</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography color="text.secondary">No expenses added yet</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Bookings Section */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Transport Bookings ({bookings.length})</Typography>
                                    <Button variant="contained" size="small">Book Transport</Button>
                                </Box>
                                {bookings.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Type</TableCell>
                                                    <TableCell>Route</TableCell>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Price</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {bookings.map(booking => (
                                                    <TableRow key={booking.id}>
                                                        <TableCell>{booking.type || booking.transportType}</TableCell>
                                                        <TableCell>{booking.pickupLocation} → {booking.dropLocation}</TableCell>
                                                        <TableCell>{booking.date}</TableCell>
                                                        <TableCell>₹{booking.price}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography color="text.secondary">No bookings added yet</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Collaboration */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Trip Collaboration</Typography>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setCollaborationOpen(true)}
                                >
                                    Open Collaboration Chat
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Collaboration Dialog */}
                <Dialog open={collaborationOpen} onClose={() => setCollaborationOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Trip Collaboration - {itinerary.destination}</DialogTitle>
                    <DialogContent sx={{ p: 0, height: '500px' }}>
                        <CollaborationChat itinerary={itinerary} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCollaborationOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

const ItineraryCreatePage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { addItinerary } = useItinerary();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        destination: '',
        source: '',
        startDate: '',
        endDate: '',
        travelers: '1',
        budget: '',
        interests: [],
        notes: ''
    });

    const interestOptions = [
        'Adventure', 'Culture', 'Food', 'Nature', 'History',
        'Beach', 'Mountains', 'Cities', 'Shopping', 'Relaxation'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate form
        if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget) {
            showSnackbar('Please fill in all required fields', 'error');
            setLoading(false);
            return;
        }

        if (formData.interests.length === 0) {
            showSnackbar('Please select at least one interest', 'error');
            setLoading(false);
            return;
        }

        // Call backend API
        const creatorEmail = localStorage.getItem('userEmail') || 'anonymous@example.com';

        itineraryService.createItinerary({
            destination: formData.destination,
            source: formData.source,
            startDate: formData.startDate,
            endDate: formData.endDate,
            budget: formData.budget,
            interests: formData.interests,
            travelers: parseInt(formData.travelers),
            description: formData.notes,
            creatorEmail: creatorEmail // Add ownership
        })
            .then(createdItinerary => {
                // Add to local context
                addItinerary({
                    id: createdItinerary.id,
                    destination: createdItinerary.destination,
                    source: createdItinerary.source,
                    startDate: createdItinerary.start_date,
                    endDate: createdItinerary.end_date,
                    budget: createdItinerary.budget,
                    interests: createdItinerary.interests,
                    travelers: createdItinerary.travelers,
                    notes: createdItinerary.description,
                    creatorEmail: createdItinerary.creatorEmail || creatorEmail
                });

                showSnackbar('Itinerary created successfully!', 'success');
                setLoading(false);

                // Reset form
                setFormData({
                    destination: '',
                    source: '',
                    startDate: '',
                    endDate: '',
                    travelers: '1',
                    budget: '',
                    interests: [],
                    notes: ''
                });

                // Navigate after a short delay
                setTimeout(() => {
                    navigate('/itineraries');
                }, 500);
            })
            .catch(error => {
                console.error('Error creating itinerary:', error);
                showSnackbar('Failed to create itinerary: ' + (error.response?.data?.error || error.message), 'error');
                setLoading(false);
            });
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/itineraries')}
                    sx={{ mb: 3 }}
                >
                    Back to Itineraries
                </Button>

                <Typography variant="h4" gutterBottom>Create New Itinerary</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Plan your perfect trip by providing these details
                </Typography>

                <Card sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Starting From *"
                                    placeholder="e.g., Delhi, London, San Francisco"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>

                            {/* Destination */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Destination *"
                                    placeholder="e.g., Paris, Tokyo, New York"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>

                            {/* Travel Dates */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Start Date *"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="End Date *"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>

                            {/* Travelers & Budget */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Number of Travelers"
                                    name="travelers"
                                    type="number"
                                    value={formData.travelers}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Budget (USD) *"
                                    placeholder="e.g., 5000"
                                    name="budget"
                                    type="number"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0 }}
                                    required
                                />
                            </Grid>

                            {/* Interests */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                    Interests (Select at least one)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {interestOptions.map(interest => (
                                        <Chip
                                            key={interest}
                                            label={interest}
                                            onClick={() => handleInterestToggle(interest)}
                                            color={formData.interests.includes(interest) ? 'primary' : 'default'}
                                            variant={formData.interests.includes(interest) ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                            </Grid>

                            {/* Notes */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Additional Notes"
                                    placeholder="Any special requests or preferences..."
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={4}
                                />
                            </Grid>

                            {/* Buttons */}
                            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/itineraries')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Itinerary'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Card>
            </Box>
        </Container>
    );
};



const NotFoundPage = () => (
    <Box sx={{ textAlign: 'center', py: 12 }}>
        <Typography variant="h2" gutterBottom>404</Typography>
        <Typography variant="h5" color="text.secondary">Page Not Found</Typography>
    </Box>
);

const TransportBookingPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { addBooking, getBookingsByItinerary, deleteBooking, updateBooking } = useTransport();
    const { itineraries } = useItinerary();
    const { currentUser } = useAuth();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [bookings, setBookings] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'airplane',
        pickupLocation: '',
        dropoffLocation: '',
        date: '',
        passengers: '1',
        price: ''
    });

    const transportOptions = [
        { type: 'airplane', label: 'Plane', basePrice: 5000, icon: <FlightIcon /> },
        { type: 'train', label: 'Train', basePrice: 1500, icon: <TrainIcon /> },
        { type: 'bus', label: 'Bus', basePrice: 800, icon: <DirectionsBusIcon /> },
        { type: 'jeep', label: 'Jeep', basePrice: 150, icon: <DirectionsCarIcon /> },
        { type: 'bike', label: 'Bike', basePrice: 50, icon: <TwoWheelerIcon /> },
        { type: 'cab', label: 'Cab', basePrice: 80, icon: <DirectionsCarIcon /> }
    ];

    const handleItinerarySelect = (itineraryId) => {
        setSelectedItinerary(itineraryId);
        setBookings(getBookingsByItinerary(itineraryId));
    };

    const handleAddBooking = () => {
        if (!selectedItinerary || !formData.pickupLocation || !formData.dropoffLocation || !formData.date) {
            showSnackbar('Please fill in all fields', 'error');
            return;
        }

        const bookingData = {
            itineraryId: selectedItinerary,
            ...formData,
            passengers: parseInt(formData.passengers),
            price: parseFloat(formData.price) || transportOptions.find(t => t.type === formData.type).basePrice
        };

        if (isEditing) {
            updateBooking(editId, bookingData);
            setBookings(bookings.map(b => b.id === editId ? { ...b, ...bookingData } : b));
            showSnackbar('Transport booking updated!', 'success');
        } else {
            const newBooking = addBooking(bookingData);
            setBookings([...bookings, newBooking]);
            showSnackbar('Transport booked successfully!', 'success');
        }

        resetForm();
    };

    const handleEditBooking = (booking) => {
        setFormData({
            type: booking.type || 'jeep',
            pickupLocation: booking.pickupLocation || '',
            dropoffLocation: booking.dropoffLocation || '',
            date: booking.date || '',
            passengers: booking.passengers ? booking.passengers.toString() : '1',
            price: booking.price ? booking.price.toString() : ''
        });
        setEditId(booking.id);
        setIsEditing(true);
        setOpenDialog(true);
    };

    const handleDeleteBooking = (id) => {
        deleteBooking(id);
        setBookings(bookings.filter(b => b.id !== id));
        showSnackbar('Booking cancelled', 'success');
    };

    const resetForm = () => {
        setOpenDialog(false);
        setIsEditing(false);
        setEditId(null);
        setFormData({
            type: 'jeep',
            pickupLocation: '',
            dropoffLocation: '',
            date: '',
            passengers: '1',
            price: ''
        });
    };

    const selectedItineraryData = itineraries.find(i => String(i.id) === String(selectedItinerary));

    // Filter active itineraries for dropdown
    const today = new Date().toISOString().split('T')[0];
    const activeItineraries = itineraries.filter(it => it.endDate >= today);
    const myItineraries = activeItineraries.filter(it => it.creatorEmail === currentUser?.email);
    const availableItineraries = activeItineraries.filter(it => it.creatorEmail !== currentUser?.email);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    sx={{ mb: 3 }}
                >
                    Back
                </Button>

                <Typography variant="h4" gutterBottom>Transport Booking</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Book jeeps, bikes, and cabs for your trips
                </Typography>

                <Grid container spacing={3}>
                    {/* Itinerary Selection */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Select Itinerary</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    value={selectedItinerary}
                                    onChange={(e) => handleItinerarySelect(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">-- Choose Itinerary --</MenuItem>
                                    {myItineraries.length > 0 && <ListSubheader>My Itineraries</ListSubheader>}
                                    {myItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.startDate})
                                        </MenuItem>
                                    ))}
                                    {availableItineraries.length > 0 && <ListSubheader>Available Tours</ListSubheader>}
                                    {availableItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.startDate})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Booking Form */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Add Transport</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => { resetForm(); setOpenDialog(true); }}
                                        disabled={!selectedItinerary}
                                    >
                                        Add Booking
                                    </Button>
                                </Box>

                                {selectedItineraryData && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Trip: {selectedItineraryData.destination} ({selectedItineraryData.startDate} - {selectedItineraryData.endDate})
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Bookings Table */}
                    <Grid item xs={12}>
                        {bookings.length === 0 ? (
                            <Card>
                                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                    <DirectionsCarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                                    <Typography color="text.secondary">No bookings yet</Typography>
                                </CardContent>
                            </Card>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell><strong>Type</strong></TableCell>
                                            <TableCell><strong>From</strong></TableCell>
                                            <TableCell><strong>To</strong></TableCell>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Passengers</strong></TableCell>
                                            <TableCell><strong>Price</strong></TableCell>
                                            <TableCell><strong>Action</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bookings.map((booking, index) => (
                                            <TableRow key={booking.id || index}>
                                                <TableCell sx={{ textTransform: 'capitalize' }}>{booking.type}</TableCell>
                                                <TableCell>{booking.pickupLocation}</TableCell>
                                                <TableCell>{booking.dropoffLocation}</TableCell>
                                                <TableCell>{booking.date}</TableCell>
                                                <TableCell>{booking.passengers}</TableCell>
                                                <TableCell>${booking.price}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleEditBooking(booking)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDeleteBooking(booking.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Grid>
                </Grid>
            </Box>

            {/* Add Booking Dialog */}
            <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Transport Booking' : 'Add Transport Booking'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Transport Type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {transportOptions.map(opt => (
                                    <MenuItem key={opt.type} value={opt.type}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Pickup Location"
                                placeholder="e.g., Hotel, Airport"
                                value={formData.pickupLocation}
                                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dropoff Location"
                                placeholder="e.g., Restaurant, Monument"
                                value={formData.dropoffLocation}
                                onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Passengers"
                                value={formData.passengers}
                                onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Price (₹)"
                                placeholder="Leave empty for base price"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={resetForm}>Cancel</Button>
                    <Button onClick={handleAddBooking} variant="contained">
                        {isEditing ? 'Update' : 'Book'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

const ExpenseTrackerPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { addExpense, getExpensesByItinerary, deleteExpense, calculateSplits, updateExpense } = useExpense();
    const { itineraries } = useItinerary();
    const { currentUser } = useAuth();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        paidBy: '',
        category: 'accommodation'
    });
    const [scanningReceipt, setScanningReceipt] = useState(false);

    const categories = ['accommodation', 'food', 'transport', 'activities', 'misc'];

    // Filter active itineraries for dropdown
    const today = new Date().toISOString().split('T')[0];
    const activeItineraries = itineraries.filter(it => it.endDate >= today);
    const myItineraries = activeItineraries.filter(it => it.creatorEmail === currentUser?.email);
    const availableItineraries = activeItineraries.filter(it => it.creatorEmail !== currentUser?.email);

    const handleItinerarySelect = (itineraryId) => {
        setSelectedItinerary(itineraryId);
        setExpenses(getExpensesByItinerary(itineraryId));
    };

    const handleAddExpense = () => {
        if (!selectedItinerary || !formData.description || !formData.amount || !formData.paidBy) {
            showSnackbar('Please fill in all fields', 'error');
            return;
        }

        const expenseData = {
            itineraryId: selectedItinerary,
            ...formData,
            amount: parseFloat(formData.amount),
            splitAmong: itineraries.find(i => String(i.id) === String(selectedItinerary))?.travelers
                ? Array(parseInt(itineraries.find(i => String(i.id) === String(selectedItinerary)).travelers)).fill(1).map((_, i) => `Traveler ${i + 1}`)
                : ['Traveler 1']
        };

        if (isEditing) {
            updateExpense(editId, expenseData);
            setExpenses(expenses.map(e => e.id === editId ? { ...e, ...expenseData } : e));
            showSnackbar('Expense updated successfully!', 'success');
        } else {
            const newExpense = addExpense(expenseData);
            setExpenses([...expenses, newExpense]);
            showSnackbar('Expense added successfully!', 'success');
        }

        resetForm();
    };

    const handleEditExpense = (expense) => {
        setFormData({
            description: expense.description || '',
            amount: expense.amount ? expense.amount.toString() : '',
            paidBy: expense.paidBy || '',
            category: expense.category || 'accommodation'
        });
        setEditId(expense.id);
        setIsEditing(true);
        setOpenDialog(true);
    };

    const handleDeleteExpense = (id) => {
        deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
        showSnackbar('Expense deleted', 'success');
    };

    const resetForm = () => {
        setOpenDialog(false);
        setIsEditing(false);
        setEditId(null);
        setFormData({
            description: '',
            amount: '',
            paidBy: '',
            category: 'accommodation'
        });
    };

    const handleScanReceipt = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanningReceipt(true);
        try {
            const result = await aiService.scanReceipt(file);
            if (result.success) {
                setFormData({
                    ...formData,
                    description: result.data.description,
                    amount: result.data.amount.toString(),
                    category: result.data.category.toLowerCase()
                });
                showSnackbar('Receipt scanned and details auto-filled!', 'success');
            }
        } catch (error) {
            showSnackbar(`Scanning failed: ${error}`, 'error');
        } finally {
            setScanningReceipt(false);
        }
    };

    const selectedItineraryData = itineraries.find(i => String(i.id) === String(selectedItinerary));
    const { totalAmount } = selectedItinerary ? calculateSplits(String(selectedItinerary), ['Traveler 1', 'Traveler 2']) : { totalAmount: 0, splits: {} };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    sx={{ mb: 3 }}
                >
                    Back
                </Button>

                <Typography variant="h4" gutterBottom>Expense Tracker</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Track and split expenses for your group trips
                </Typography>

                <Grid container spacing={3}>
                    {/* Itinerary Selection */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Select Itinerary</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    value={selectedItinerary}
                                    onChange={(e) => handleItinerarySelect(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">-- Choose Itinerary --</MenuItem>
                                    {myItineraries.length > 0 && <ListSubheader>My Itineraries</ListSubheader>}
                                    {myItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.travelers} travelers)
                                        </MenuItem>
                                    ))}
                                    {availableItineraries.length > 0 && <ListSubheader>Available Tours</ListSubheader>}
                                    {availableItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.travelers} travelers)
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Summary Cards */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ backgroundColor: '#e3f2fd' }}>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>Total Expenses</Typography>
                                        <Typography variant="h5">₹{totalAmount.toFixed(2)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ backgroundColor: '#f3e5f5' }}>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>Per Person</Typography>
                                        <Typography variant="h5">
                                            ₹{selectedItineraryData ? (totalAmount / parseInt(selectedItineraryData.travelers)).toFixed(2) : '0.00'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Add Expense Button */}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { resetForm(); setOpenDialog(true); }}
                            disabled={!selectedItinerary}
                        >
                            Add Expense
                        </Button>
                    </Grid>

                    {/* Expenses Table */}
                    <Grid item xs={12}>
                        {expenses.length > 0 && selectedItineraryData && (
                            <ExpenseAnalytics expenses={expenses} budget={selectedItineraryData.budget || 0} />
                        )}

                        <Box sx={{ p: 4 }}>
                            <Grid container spacing={4}>
                                {/* Expense List */}
                                <Grid item xs={12}>
                                    {expenses.length === 0 ? (
                                        <Card>
                                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="textSecondary">No expenses yet</Typography>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <TableContainer component={Paper}>
                                            <Table>
                                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableRow>
                                                        <TableCell><strong>Description</strong></TableCell>
                                                        <TableCell><strong>Category</strong></TableCell>
                                                        <TableCell><strong>Amount</strong></TableCell>
                                                        <TableCell><strong>Paid By</strong></TableCell>
                                                        <TableCell><strong>Action</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {expenses.map((expense, index) => (
                                                        <TableRow key={expense.id || index}>
                                                            <TableCell>{expense.description}</TableCell>
                                                            <TableCell sx={{ textTransform: 'capitalize' }}>{expense.category}</TableCell>
                                                            <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                                                            <TableCell>{expense.paidBy}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<EditIcon />}
                                                                    onClick={() => handleEditExpense(expense)}
                                                                    sx={{ mr: 1 }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    startIcon={<DeleteIcon />}
                                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>

                        <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {isEditing ? 'Edit Expense' : 'Add Expense'}
                                {!isEditing && (
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        size="small"
                                        startIcon={scanningReceipt ? <CircularProgress size={16} /> : <CameraAltIcon />}
                                        disabled={scanningReceipt}
                                    >
                                        {scanningReceipt ? 'Scanning...' : 'Scan Receipt'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleScanReceipt}
                                        />
                                    </Button>
                                )}
                            </DialogTitle>
                            <DialogContent sx={{ pt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            placeholder="e.g., Hotel booking, Dinner"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <MenuItem key={cat} value={cat} sx={{ textTransform: 'capitalize' }}>{cat}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Amount (₹)"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            inputProps={{ step: '0.01', min: 0 }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Paid By"
                                            placeholder="e.g., John"
                                            value={formData.paidBy}
                                            onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={resetForm}>Cancel</Button>
                                <Button onClick={handleAddExpense} variant="contained">
                                    {isEditing ? 'Update' : 'Add'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Grid>
                </Grid>
            </Box>
        </Container >
    );
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth(); // We'll just update local state manually or re-login
    const { showSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({
        fullName: currentUser?.fullName || '',
        email: currentUser?.email || '',
        mobile: currentUser?.mobile || ''
    });

    const [buddyMatches, setBuddyMatches] = useState(null);
    const [findingBuddies, setFindingBuddies] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/profile', {
                email: formData.email, // Identify user by email
                fullName: formData.fullName,
                mobile: formData.mobile
            });

            if (response.data.success) {
                // Update local storage
                const updatedUser = { ...currentUser, ...formData };
                localStorage.setItem('userData', JSON.stringify(updatedUser)); // Hacky update
                // ideally call a dedicated updateContext method
                showSnackbar('Profile updated successfully', 'success');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showSnackbar('Failed to update profile', 'error');
        }
    };

    const handleFindBuddies = async () => {
        setFindingBuddies(true);
        try {
            // Mock interests for demo
            const interests = ['adventure', 'photography', 'foodie'];
            const result = await aiService.getBuddyMatches(interests, 'adventurous');
            setBuddyMatches(result.matches);
            showSnackbar('Found potential travel buddies!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setFindingBuddies(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 3 }}>
                    Back
                </Button>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>My Profile 👤</Typography>
                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        margin="normal"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        margin="normal"
                                        helperText="Email cannot be changed"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Mobile Number"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        margin="normal"
                                    />
                                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
                                        Update Profile
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%', bgcolor: '#f0f4f8' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>🤝 Travel Buddy Match</Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Find travelers with similar interests and plan your next big trip together!
                                </Typography>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={handleFindBuddies}
                                    disabled={findingBuddies}
                                    sx={{ mb: 3 }}
                                >
                                    {findingBuddies ? <CircularProgress size={24} /> : 'Find My Travel Buddies ✨'}
                                </Button>

                                {buddyMatches && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {buddyMatches.map((buddy, idx) => (
                                            <Card key={idx} sx={{ bgcolor: 'white' }}>
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {buddy.name}
                                                        </Typography>
                                                        <Chip
                                                            label={`${buddy.match_score}% Match`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Interests: {buddy.interests.join(', ')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        "{buddy.reason}"
                                                    </Typography>
                                                    <Button size="small" sx={{ mt: 1 }}>Connect</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

const WeatherPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { itineraries } = useItinerary();
    const { currentUser } = useAuth();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    const handleLoadWeather = async () => {
        if (!selectedItinerary) {
            showSnackbar('Please select an itinerary', 'error');
            return;
        }

        setLoading(true);
        try {
            const itinerary = itineraries.find(i => String(i.id) === String(selectedItinerary));
            if (!itinerary) {
                showSnackbar('Itinerary not found', 'error');
                setLoading(false);
                return;
            }
            const interests = itinerary.interests || [];

            const weatherData = await fetchWeatherForecast(
                itinerary.destination,
                itinerary.startDate,
                itinerary.endDate,
                interests
            );

            setWeather(weatherData);

            // Use packing recommendations from API or fall back to calculated ones
            const recs = weatherData.packingRecommendations ||
                weatherData.packing_recommendations?.interest_based ||
                getWeatherRecommendations(weatherData.forecast || []);
            setRecommendations(Array.isArray(recs) ? recs : Object.values(recs).flat());

            showSnackbar('Weather data loaded!', 'success');
        } catch (error) {
            console.error('Weather error:', error);
            showSnackbar('Failed to load weather data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Safe access to weather data with fallbacks
    const weatherData = weather || {};
    const forecast = weatherData.forecast || [];
    const summary = weatherData.summary || {};

    // Filter active itineraries for dropdown
    const today = new Date().toISOString().split('T')[0];
    const activeItineraries = itineraries.filter(it => it.endDate >= today);
    const myItineraries = activeItineraries.filter(it => it.creatorEmail === currentUser?.email);
    const availableItineraries = activeItineraries.filter(it => it.creatorEmail !== currentUser?.email);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    sx={{ mb: 3 }}
                >
                    Back
                </Button>

                <Typography variant="h4" gutterBottom>Weather & Packing Guide</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Check weather forecast and get smart packing recommendations
                </Typography>

                <Grid container spacing={3}>
                    {/* Selection Card */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Select Your Trip</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    value={selectedItinerary}
                                    onChange={(e) => setSelectedItinerary(e.target.value)}
                                    size="small"
                                    sx={{ mb: 2 }}
                                >
                                    <MenuItem value="">-- Choose Itinerary --</MenuItem>
                                    {myItineraries.length > 0 && <ListSubheader>My Itineraries</ListSubheader>}
                                    {myItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.startDate})
                                        </MenuItem>
                                    ))}
                                    {availableItineraries.length > 0 && <ListSubheader>Available Tours</ListSubheader>}
                                    {availableItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.startDate})
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleLoadWeather}
                                    disabled={loading || !selectedItinerary}
                                >
                                    {loading ? 'Loading...' : 'Get Weather Forecast'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Summary */}
                    {weather && (
                        <Grid item xs={12} md={6}>
                            <Card sx={{ backgroundColor: '#fff3e0' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>{weather.destination}</Typography>
                                    <Typography variant="body2" color="textSecondary" paragraph>
                                        {weather.start_date || weather.startDate} to {weather.end_date || weather.endDate}
                                    </Typography>
                                    <Typography variant="body2"><strong>Avg Temp:</strong> {summary.avg_temperature || summary.avgTemp}°C</Typography>
                                    <Typography variant="body2"><strong>Condition:</strong> {summary.most_common_condition || summary.condition}</Typography>
                                    <Typography variant="body2"><strong>Rainy Days:</strong> {summary.rainy_days || 0}</Typography>
                                    <Typography variant="body2"><strong>Sunny Days:</strong> {summary.sunny_days || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Daily Forecast */}
                    {forecast.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Daily Forecast</Typography>
                            <Grid container spacing={2}>
                                {forecast.map((day, idx) => (
                                    <Grid item xs={12} sm={6} md={4} key={idx}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="subtitle2">{day.date} ({day.day_of_week})</Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    <strong>🌡️ {day.temp}°C</strong> (L: {day.temp_min}°C / H: {day.temp_max}°C)
                                                </Typography>
                                                <Typography variant="body2">
                                                    {day.condition}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    💧 {day.humidity}% | 💨 {day.wind_speed} km/h | 🌧️ {day.precipitation}%
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    )}

                    {/* Packing Recommendations */}
                    {recommendations.length > 0 && (
                        <Grid item xs={12}>
                            <Card sx={{ backgroundColor: '#e8f5e9' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Packing Recommendations</Typography>
                                    {recommendations.slice(0, 10).map((rec, idx) => (
                                        <Alert key={idx} severity="info" sx={{ mb: 1 }}>
                                            {typeof rec === 'string' ? rec : rec}
                                        </Alert>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

// ============ FEATURE COMPONENTS ============

// 1. AI-Powered Itinerary Generation
const AIItineraryGenerator = ({ itinerary }) => {
    const [generating, setGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [inputs, setInputs] = useState({
        destination: itinerary?.destination || '',
        days: itinerary?.duration || 3,
        budget: itinerary?.budget || 1000,
        interests: itinerary?.interests || []
    });

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            // Use the new /api/ai/generate endpoint
            const response = await fetch('http://localhost:5000/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: inputs.destination,
                    days: inputs.days,
                    budget: inputs.budget,
                    interests: inputs.interests
                })
            });
            const data = await response.json();
            if (data.success) {
                setGeneratedPlan(data.data);
            } else {
                alert('AI Generation Failed: ' + data.message);
            }
        } catch (error) {
            console.error('AI generation error:', error);
            alert('Failed to connect to AI service');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card sx={{ mb: 2, border: '2px solid #FFD700' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>✨ AI-Powered Itinerary Generator</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generate a personalized day-by-day plan using AI.
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <TextField
                            label="Destination"
                            fullWidth size="small"
                            value={inputs.destination}
                            onChange={(e) => setInputs({ ...inputs, destination: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            label="Days"
                            type="number" fullWidth size="small"
                            value={inputs.days}
                            onChange={(e) => setInputs({ ...inputs, days: parseInt(e.target.value) })}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            label="Budget (₹)"
                            type="number" fullWidth size="small"
                            value={inputs.budget}
                            onChange={(e) => setInputs({ ...inputs, budget: parseInt(e.target.value) })}
                        />
                    </Grid>
                </Grid>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateAI}
                    disabled={generating}
                    sx={{ mb: 2, background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', color: 'white' }}
                >
                    {generating ? 'Designing your trip...' : 'Generate Itinerary ✨'}
                </Button>

                {generatedPlan && (
                    <Paper sx={{ p: 2, backgroundColor: '#fffaf0', maxHeight: '400px', overflowY: 'auto' }}>
                        <Typography variant="h6" color="primary">{generatedPlan.summary}</Typography>
                        {generatedPlan.daily_plan?.map((day, idx) => (
                            <Box key={idx} sx={{ mt: 2, p: 1, borderLeft: '3px solid #FF8E53', pl: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Day {day.day}: {day.theme}</Typography>
                                {day.activities.map((act, actIdx) => (
                                    <Typography key={actIdx} variant="body2" sx={{ ml: 1 }}>
                                        • <strong>{act.time}</strong>: {act.activity} (₹{act.cost_estimate})
                                    </Typography>
                                ))}
                            </Box>
                        ))}
                    </Paper>
                )}
            </CardContent>
        </Card>
    );
};

// 2. Real-time Transport Availability
const RealTimeTransportAvailability = () => {
    const transports = [
        { type: 'Cabs', icon: '🚕', available: 5, price: '$15-20' },
        { type: 'Bikes', icon: '🏍️', available: 12, price: '$10-15' },
        { type: 'Jeeps', icon: '🚙', available: 3, price: '$30-40' }
    ];

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>🚗 Real-time Transport Availability</Typography>
                <Grid container spacing={2}>
                    {transports.map((transport) => (
                        <Grid item xs={12} sm={6} key={transport.type}>
                            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2">{transport.icon} {transport.type}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {transport.available} available • {transport.price}
                                        </Typography>
                                    </Box>
                                    <Button size="small" variant="contained">Book</Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

// 3. Group Trip Planning
const GroupTripPlanning = ({ itinerary }) => {
    const [members] = useState(['You', 'Alice', 'Bob', 'Charlie']);

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>👥 Group Trip Planning</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {members.map(member => (
                        <Chip key={member} label={member} variant="outlined" />
                    ))}
                    <Button size="small" variant="contained">+ Invite</Button>
                </Box>
                <Button variant="outlined" fullWidth>Manage Group Expenses</Button>
            </CardContent>
        </Card>
    );
};

// 4. Real-time Itinerary Adjustments
const RealTimeAdjustmentsPanel = ({ itinerary }) => (
    <Card sx={{ mb: 2 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>⏰ Real-time Adjustments</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                ☔ Based on current weather: Light rain expected. Consider indoor activities.
            </Alert>
            <Button variant="contained" fullWidth sx={{ mb: 1 }}>View Alternative Activities</Button>
            <Button variant="outlined" fullWidth>Adjust Itinerary</Button>
        </CardContent>
    </Card>
);

// 5. Local Provider Directory
const LocalProviderDirectory = ({ destination = 'Current Location' }) => {
    const providers = [
        { name: 'Top Rated Hotels', rating: '5★', avg: '$120/night' },
        { name: 'Local Restaurants', rating: '4.5★', avg: '$25/meal' },
        { name: 'Tour Operators', rating: '4.8★', avg: '$80/tour' },
        { name: 'Adventure Sports', rating: '4.6★', avg: '$60/activity' }
    ];

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>🏨 Local Providers in {destination}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {providers.map((provider, idx) => (
                        <Paper key={idx} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="subtitle2">{provider.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {provider.rating} | Average: {provider.avg}
                                    </Typography>
                                </Box>
                                <Button size="small">View</Button>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
};

// 6. Expense Splitting Calculator (Enhanced)
const ExpenseSplittingCalculator = ({ itinerary, expenses, travelers }) => {
    const [splits] = useState({});

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>💰 Expense Splitting</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(splits).map(([person, amount]) => (
                        <Paper key={person} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography>{person}</Typography>
                            <Typography variant="subtitle2" color="primary">${amount.toFixed(2)}</Typography>
                        </Paper>
                    ))}
                </Box>
                {expenses && expenses.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>Add expenses to calculate splits</Typography>
                )}
            </CardContent>
        </Card>
    );
};

// 7. Smart Packing Assistant
const SmartPackingAssistant = ({ weather = 'sunny' }) => {
    const packingLists = {
        sunny: ['☀️ Sunscreen SPF 50', '😎 Sunglasses', '🧢 Hat', '👕 Light clothing', '🩴 Sandals'],
        rainy: ['☔ Umbrella', '🧥 Raincoat', '👟 Waterproof shoes', '🎒 Dry bag', '🧤 Rain gear'],
        cold: ['🧥 Warm jacket', '🧣 Scarf', '🧤 Gloves', '🧢 Beanie', '🧦 Warm socks']
    };

    const packingList = packingLists[weather] || packingLists.sunny;

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>🎒 Smart Packing Assistant</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Based on {weather} weather forecast
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {packingList.map((item, idx) => (
                        <Chip key={idx} label={item} />
                    ))}
                </Box>
                <Button variant="outlined" fullWidth>Download Full Checklist</Button>
            </CardContent>
        </Card>
    );
};

// 8. Chat/Collaboration Features
// 8. Chat/Collaboration Features
const CollaborationChat = ({ itinerary }) => {
    const { showSnackbar } = useSnackbar();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState(localStorage.getItem('userEmail') || 'Traveler'); // Simple user identity
    const chatContainerRef = React.useRef(null);
    const socketRef = React.useRef(null);

    // Fetch messages
    const fetchMessages = React.useCallback(async () => {
        if (!itinerary?.id) return;
        try {
            const response = await api.get(`/itinerary/${itinerary.id}/chat`);
            if (response.data.success) {
                // Merge with existing to avoid jitter, or just replace
                // Here we replace, but socket keeps it fresh
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
        }
    }, [itinerary?.id]);

    // Initial fetch and Socket setup
    useEffect(() => {
        fetchMessages();

        // Connect Socket
        socketRef.current = io('http://localhost:5000');
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log("Socket connected");
            if (itinerary?.id) {
                socket.emit('join', { room: itinerary.id });
            }
        });

        socket.on('new_message', (msg) => {
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            if (itinerary?.id) {
                socket.emit('leave', { room: itinerary.id });
            }
            socket.disconnect();
        };
    }, [fetchMessages, itinerary?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !itinerary?.id) return;

        const tempId = 'temp-' + Date.now();
        const payload = {
            user: user,
            text: newMessage
        };

        // Optimistic update
        const tempMessage = {
            ...payload,
            timestamp: new Date().toISOString(),
            id: tempId
        };
        setMessages([...messages, tempMessage]);
        setNewMessage('');

        try {
            const response = await api.post(`/itinerary/${itinerary.id}/chat`, payload);
            if (response.data.success) {
                const realMsg = response.data.data;
                // Replace temp with real
                setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showSnackbar('Failed to send message', 'error');
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return (
        <Card sx={{ mb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                    💬 Trip Collaboration - {itinerary?.destination || 'Trip Chat'}
                </Typography>

                {/* Identity Input (for demo purposes) */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        label="Your Name/Email"
                        variant="standard"
                        size="small"
                        value={user}
                        onChange={(e) => {
                            setUser(e.target.value);
                            localStorage.setItem('userEmail', e.target.value);
                        }}
                        fullWidth
                    />
                </Box>

                <Paper
                    ref={chatContainerRef}
                    sx={{
                        p: 2,
                        flexGrow: 1,
                        minHeight: '300px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        mb: 2,
                        backgroundColor: '#f9f9f9'
                    }}
                >
                    {messages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                            No messages yet. Start the conversation!
                        </Typography>
                    ) : (
                        messages.map((msg, idx) => (
                            <Box key={msg.id || idx} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: msg.user === user ? 'flex-end' : 'flex-start' }}>
                                <Box sx={{
                                    maxWidth: '80%',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: msg.user === user ? 'primary.main' : 'white',
                                    color: msg.user === user ? 'white' : 'text.primary',
                                    boxShadow: 1
                                }}>
                                    <Typography variant="body2">{msg.text}</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                                    {msg.user} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Paper>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Type your message..."
                        size="small"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button variant="contained" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        Send
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

const MemoriesPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { itineraries } = useItinerary();
    const { currentUser } = useAuth();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [narrative, setNarrative] = useState(null);
    const [loading, setLoading] = useState(false);

    // Passport state
    const [landmarkInput, setLandmarkInput] = useState('');
    const [stamps, setStamps] = useState(() => {
        const saved = localStorage.getItem('passport_stamps');
        return saved ? JSON.parse(saved) : [];
    });
    const [collecting, setCollecting] = useState(false);

    useEffect(() => {
        localStorage.setItem('passport_stamps', JSON.stringify(stamps));
    }, [stamps]);

    const handleGenerateMemories = async () => {
        if (!selectedItinerary) {
            showSnackbar('Please select an itinerary', 'error');
            return;
        }

        setLoading(true);
        try {
            const itinerary = itineraries.find(i => String(i.id) === String(selectedItinerary));
            const activities = itinerary.activities?.map(a => a.name) || [itinerary.theme || 'Exploring'];

            const result = await aiService.getTripNarrative(itinerary.destination, activities);
            setNarrative(result);
            showSnackbar('Memory Mosaic created!', 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCollectStamp = async (e) => {
        e.preventDefault();
        if (!landmarkInput) return;

        setCollecting(true);
        try {
            const result = await aiService.collectStamp(landmarkInput);
            setStamps([...stamps, result]);
            setLandmarkInput('');
            showSnackbar(`New stamp collected: ${result.stamp_name}!`, 'success');
        } catch (error) {
            showSnackbar(`Error: ${error}`, 'error');
        } finally {
            setCollecting(false);
        }
    };

    const myItineraries = itineraries.filter(it => it.creatorEmail === currentUser?.email);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 3 }}>
                    Back
                </Button>

                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>📸 Memory Mosaic</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Preserve your travel stories with AI-generated digital scrapbooks.
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Recall Your Trip</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    label="Choose a Trip"
                                    value={selectedItinerary}
                                    onChange={(e) => setSelectedItinerary(e.target.value)}
                                    size="small"
                                    sx={{ mb: 2 }}
                                >
                                    <MenuItem value="">-- Select Itinerary --</MenuItem>
                                    {myItineraries.map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.destination} ({it.startDate})
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleGenerateMemories}
                                    disabled={loading || !selectedItinerary}
                                    sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Create Digital Scrapbook'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {narrative ? (
                            <Box>
                                <Paper sx={{ p: 4, bgcolor: '#fdf5e6', border: '1px solid #deb887', borderRadius: 4, mb: 4 }}>
                                    <Typography variant="h5" color="primary" sx={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', mb: 2 }}>
                                        The Story of {narrative.destination}
                                    </Typography>
                                    <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                                        {narrative.narrative}
                                    </Typography>
                                </Paper>

                                <Typography variant="h6" gutterBottom>✨ Magic Moments</Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {narrative.highlights && narrative.highlights.map((highlight, idx) => (
                                        <Grid item xs={12} sm={4} key={idx}>
                                            <Card sx={{ height: '100%', bgcolor: '#fff' }}>
                                                <CardContent>
                                                    <Box sx={{ color: 'secondary.main', mb: 1 }}>🌟</Box>
                                                    <Typography variant="body2">{highlight}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ) : (
                            <Paper sx={{ p: 10, textAlign: 'center', bgcolor: '#f5f5f5', border: '2px dashed #ccc', mb: 4 }}>
                                <Typography color="text.secondary">Select a past trip to relive the magic.</Typography>
                            </Paper>
                        )}

                        {/* Digital Passport Section */}
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>📖 Digital Passport</Typography>
                        <Card sx={{ mb: 4, bgcolor: '#f0f4f8' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Collect a New Stamp</Typography>
                                <Box component="form" onSubmit={handleCollectStamp} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <TextField
                                        label="Landmark Visited"
                                        size="small"
                                        fullWidth
                                        value={landmarkInput}
                                        onChange={(e) => setLandmarkInput(e.target.value)}
                                        placeholder="e.g., Eiffel Tower, Taj Mahal"
                                    />
                                    <Button type="submit" variant="contained" disabled={collecting || !landmarkInput}>
                                        {collecting ? <CircularProgress size={24} /> : 'Collect 🏅'}
                                    </Button>
                                </Box>

                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Your Stamps ({stamps.length})</Typography>
                                <Grid container spacing={2}>
                                    {stamps.length === 0 ? (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" align="center">Your passport is empty. Visit landmarks to earn stamps!</Typography>
                                        </Grid>
                                    ) : (
                                        stamps.map((stamp, idx) => (
                                            <Grid item xs={12} sm={6} key={idx}>
                                                <Paper sx={{ p: 2, borderLeft: `5px solid ${stamp.color || '#3f51b5'}`, bgcolor: 'white' }}>
                                                    <Typography variant="subtitle2" sx={{ color: stamp.color || '#3f51b5', fontWeight: 'bold' }}>
                                                        {stamp.stamp_name}
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>{stamp.landmark}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {stamp.story}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        ))
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export {
    ItineraryListPage,
    ItineraryDetailPage,
    ItineraryCreatePage,
    ProfilePage,
    NotFoundPage,
    TransportBookingPage,
    ExpenseTrackerPage,
    WeatherPage,
    MemoriesPage,
    AIItineraryGenerator,
    RealTimeTransportAvailability,
    GroupTripPlanning,
    RealTimeAdjustmentsPanel,
    LocalProviderDirectory,
    ExpenseSplittingCalculator,
    SmartPackingAssistant,
    CollaborationChat,
    AIRecommendationsPage
};
