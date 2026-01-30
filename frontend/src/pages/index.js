import React, { useState } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, Container,
    TextField, MenuItem, Paper, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useItinerary } from '../contexts/ItineraryContext';
import { useTransport } from '../contexts/TransportContext';
import { useExpense } from '../contexts/ExpenseContext';
import AddIcon from '@mui/icons-material/Add';
import EmptyStateIcon from '@mui/icons-material/LuggageOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import { fetchWeatherForecast, getWeatherRecommendations } from '../services/weatherService';
import { itineraryService } from '../services/itineraryService';

const ItineraryListPage = () => {
    const navigate = useNavigate();
    const { itineraries, deleteItinerary } = useItinerary();

    const handleDelete = (id) => {
        deleteItinerary(id);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">My Itineraries</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/itineraries/create')}
                >
                    Create Itinerary
                </Button>
            </Box>

            {itineraries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <EmptyStateIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No itineraries yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Start planning your next adventure by creating a new itinerary.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/itineraries/create')}
                        sx={{ mt: 2 }}
                    >
                        Create Your First Itinerary
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {itineraries.map(itinerary => (
                        <Grid item xs={12} md={6} lg={4} key={itinerary.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {itinerary.destination}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        <strong>Dates:</strong> {itinerary.startDate} to {itinerary.endDate}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        <strong>Budget:</strong> ${itinerary.budget}
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
                                <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        color="error"
                                        onClick={() => handleDelete(itinerary.id)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
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
                        <Typography variant="h3" gutterBottom>
                            {itinerary.destination}
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Dates</Typography>
                                <Typography variant="h6">
                                    {itinerary.startDate} → {itinerary.endDate}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Budget</Typography>
                                <Typography variant="h6">${itinerary.budget}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Travelers</Typography>
                                <Typography variant="h6">{itinerary.travelers}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="body2" opacity={0.9}>Total Expenses</Typography>
                                <Typography variant="h6">${totalAmount.toFixed(2)}</Typography>
                            </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
                            {(itinerary.interests || []).map(interest => (
                                <Chip key={interest} label={interest} />
                            ))}
                        </Box>
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
                                                        <TableCell>${expense.amount}</TableCell>
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
                                                        <TableCell>${booking.price}</TableCell>
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
                    <DialogContent>
                        <Box sx={{ py: 2, minHeight: '300px', backgroundColor: '#f5f5f5', borderRadius: 1, p: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                💬 Chat with your travel companions about {itinerary.destination}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Type your message..."
                            variant="outlined"
                            size="small"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCollaborationOpen(false)}>Close</Button>
                        <Button variant="contained">Send Message</Button>
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
        itineraryService.createItinerary({
            destination: formData.destination,
            startDate: formData.startDate,
            endDate: formData.endDate,
            budget: formData.budget,
            interests: formData.interests,
            travelers: parseInt(formData.travelers),
            description: formData.notes
        })
            .then(createdItinerary => {
                // Add to local context
                addItinerary({
                    id: createdItinerary.id,
                    destination: createdItinerary.destination,
                    startDate: createdItinerary.start_date,
                    endDate: createdItinerary.end_date,
                    budget: createdItinerary.budget,
                    interests: createdItinerary.interests,
                    travelers: createdItinerary.travelers,
                    notes: createdItinerary.description
                });

                showSnackbar('Itinerary created successfully!', 'success');
                setLoading(false);

                // Reset form
                setFormData({
                    destination: '',
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

const ProfilePage = () => {
    const { itineraries } = useItinerary();
    const { bookings } = useTransport();
    const { expenses } = useExpense();
    const [profileData] = useState({
        name: 'Traveler',
        email: localStorage.getItem('userEmail') || 'user@example.com',
        phone: '+1-800-TRAVEL',
        bio: 'Travel enthusiast exploring the world',
        joinDate: 'January 2024',
        country: 'USA',
        preferences: ['Adventure', 'Food', 'Culture']
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const totalBookings = bookings.length;
    const totalTrips = itineraries.length;

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Grid container spacing={3}>
                    {/* Profile Header Card */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            backgroundColor: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: 40
                                        }}
                                    >
                                        🧳
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4">{profileData.name}</Typography>
                                        <Typography color="text.secondary">{profileData.email}</Typography>
                                        <Typography variant="body2" color="text.secondary">Joined {profileData.joinDate}</Typography>
                                    </Box>
                                    <Button variant="outlined">Edit Profile</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Stats Cards */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="primary" variant="h4" gutterBottom>
                                    {totalTrips}
                                </Typography>
                                <Typography variant="body2">Total Trips</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="success.main" variant="h4" gutterBottom>
                                    {totalBookings}
                                </Typography>
                                <Typography variant="body2">Transport Bookings</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="warning.main" variant="h4" gutterBottom>
                                    ${totalExpenses.toFixed(0)}
                                </Typography>
                                <Typography variant="body2">Total Expenses</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="info.main" variant="h4" gutterBottom>
                                    {itineraries.length * 5}
                                </Typography>
                                <Typography variant="body2">Travel Points</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Profile Information */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                                        <Typography>{profileData.phone}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Country</Typography>
                                        <Typography>{profileData.country}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Bio</Typography>
                                        <Typography>{profileData.bio}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Travel Preferences */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Travel Preferences</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                    {profileData.preferences.map(pref => (
                                        <Chip key={pref} label={pref} color="primary" />
                                    ))}
                                </Box>
                                <Typography variant="body2" color="text.secondary">Notifications</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="body2">Email notifications</Typography>
                                    <Typography variant="body2">Enabled</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Upcoming Trips */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Recent Trips</Typography>
                                {itineraries.slice(0, 3).length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {itineraries.slice(0, 3).map(trip => (
                                            <Paper key={trip.id} sx={{ p: 2, backgroundColor: '#fafafa' }}>
                                                <Typography variant="subtitle1">{trip.destination}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {trip.startDate} to {trip.endDate}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">No trips yet. Start planning!</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Account Settings */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Account Settings</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button variant="outlined" fullWidth>Change Password</Button>
                                    <Button variant="outlined" fullWidth>Privacy Settings</Button>
                                    <Button variant="outlined" color="error" fullWidth>Logout</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
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
    const { addBooking, getBookingsByItinerary, deleteBooking } = useTransport();
    const { itineraries } = useItinerary();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [bookings, setBookings] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        type: 'jeep',
        pickupLocation: '',
        dropoffLocation: '',
        date: '',
        passengers: '1',
        price: ''
    });

    const transportOptions = [
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

        const newBooking = {
            itineraryId: selectedItinerary,
            ...formData,
            passengers: parseInt(formData.passengers),
            price: parseFloat(formData.price) || transportOptions.find(t => t.type === formData.type).basePrice
        };

        addBooking(newBooking);
        setBookings([...bookings, newBooking]);
        showSnackbar('Transport booked successfully!', 'success');
        setOpenDialog(false);
        setFormData({
            type: 'jeep',
            pickupLocation: '',
            dropoffLocation: '',
            date: '',
            passengers: '1',
            price: ''
        });
    };

    const handleDeleteBooking = (id) => {
        deleteBooking(id);
        setBookings(bookings.filter(b => b.id !== id));
        showSnackbar('Booking cancelled', 'success');
    };

    const selectedItineraryData = itineraries.find(i => String(i.id) === String(selectedItinerary));

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
                                    {itineraries.map(it => (
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
                                        onClick={() => setOpenDialog(true)}
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
                                        {bookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell sx={{ textTransform: 'capitalize' }}>{booking.type}</TableCell>
                                                <TableCell>{booking.pickupLocation}</TableCell>
                                                <TableCell>{booking.dropoffLocation}</TableCell>
                                                <TableCell>{booking.date}</TableCell>
                                                <TableCell>{booking.passengers}</TableCell>
                                                <TableCell>${booking.price}</TableCell>
                                                <TableCell>
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
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Transport Booking</DialogTitle>
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
                                label="Price ($)"
                                placeholder="Leave empty for base price"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddBooking} variant="contained">Book</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

const ExpenseTrackerPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { addExpense, getExpensesByItinerary, deleteExpense, calculateSplits } = useExpense();
    const { itineraries } = useItinerary();
    const [selectedItinerary, setSelectedItinerary] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        paidBy: '',
        category: 'accommodation'
    });

    const categories = ['accommodation', 'food', 'transport', 'activities', 'misc'];

    const handleItinerarySelect = (itineraryId) => {
        setSelectedItinerary(itineraryId);
        setExpenses(getExpensesByItinerary(itineraryId));
    };

    const handleAddExpense = () => {
        if (!selectedItinerary || !formData.description || !formData.amount || !formData.paidBy) {
            showSnackbar('Please fill in all fields', 'error');
            return;
        }

        const newExpense = {
            itineraryId: selectedItinerary,
            ...formData,
            amount: parseFloat(formData.amount),
            splitAmong: itineraries.find(i => String(i.id) === String(selectedItinerary))?.travelers
                ? Array(parseInt(itineraries.find(i => String(i.id) === String(selectedItinerary)).travelers)).fill(1).map((_, i) => `Traveler ${i + 1}`)
                : ['Traveler 1']
        };

        addExpense(newExpense);
        setExpenses([...expenses, newExpense]);
        showSnackbar('Expense added successfully!', 'success');
        setOpenDialog(false);
        setFormData({
            description: '',
            amount: '',
            paidBy: '',
            category: 'accommodation'
        });
    };

    const handleDeleteExpense = (id) => {
        deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
        showSnackbar('Expense deleted', 'success');
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
                                    {itineraries.map(it => (
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
                                        <Typography variant="h5">${totalAmount.toFixed(2)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card sx={{ backgroundColor: '#f3e5f5' }}>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>Per Person</Typography>
                                        <Typography variant="h5">
                                            ${selectedItineraryData ? (totalAmount / parseInt(selectedItineraryData.travelers)).toFixed(2) : '0.00'}
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
                            onClick={() => setOpenDialog(true)}
                            disabled={!selectedItinerary}
                        >
                            Add Expense
                        </Button>
                    </Grid>

                    {/* Expenses Table */}
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
                                        {expenses.map(expense => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{expense.description}</TableCell>
                                                <TableCell sx={{ textTransform: 'capitalize' }}>{expense.category}</TableCell>
                                                <TableCell>${expense.amount.toFixed(2)}</TableCell>
                                                <TableCell>{expense.paidBy}</TableCell>
                                                <TableCell>
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

            {/* Add Expense Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Expense</DialogTitle>
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
                                label="Amount ($)"
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
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddExpense} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

const WeatherPage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { itineraries } = useItinerary();
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
                                    {itineraries.map(it => (
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
    const [suggestions, setSuggestions] = useState([]);

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            const response = await fetch('http://localhost:5000/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: itinerary?.destination || 'Paris',
                    budget: itinerary?.budget || 2000,
                    interests: itinerary?.interests || ['Culture', 'Food']
                })
            });
            const data = await response.json();
            setSuggestions([data.message || 'Generated suggestions for your trip']);
            setGenerating(false);
        } catch (error) {
            console.error('AI generation error:', error);
            setSuggestions(['Error generating suggestions']);
            setGenerating(false);
        }
    };

    return (
        <Card sx={{ mb: 2, border: '2px solid #FFD700' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>✨ AI-Powered Recommendations</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Get personalized recommendations based on your interests and budget
                </Typography>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateAI}
                    disabled={generating}
                    sx={{ mb: 2 }}
                >
                    {generating ? 'Generating...' : 'Generate AI Suggestions'}
                </Button>
                {suggestions.length > 0 && (
                    <Paper sx={{ p: 2, backgroundColor: '#fffaf0' }}>
                        {suggestions.map((sugg, idx) => (
                            <Typography key={idx} variant="body2">{sugg}</Typography>
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
const CollaborationChat = ({ itinerary }) => {
    const [messages, setMessages] = useState([
        { user: 'Alice', text: 'Let\'s meet at the Eiffel Tower!', time: '10:30 AM' },
        { user: 'You', text: 'Sounds good! What time?', time: '10:35 AM' },
        { user: 'Bob', text: 'I\'ll be there by noon', time: '10:40 AM' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { user: 'You', text: newMessage, time: new Date().toLocaleTimeString() }]);
            setNewMessage('');
        }
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>💬 Trip Collaboration - {itinerary?.destination || 'Trip Chat'}</Typography>
                <Paper sx={{ p: 2, minHeight: '200px', maxHeight: '300px', overflowY: 'auto', mb: 2, backgroundColor: '#f9f9f9' }}>
                    {messages.map((msg, idx) => (
                        <Box key={idx} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" color="primary">{msg.user}</Typography>
                                <Typography variant="caption" color="text.secondary">{msg.time}</Typography>
                            </Box>
                            <Typography variant="body2">{msg.text}</Typography>
                        </Box>
                    ))}
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
                    <Button variant="contained" onClick={handleSendMessage}>Send</Button>
                </Box>
            </CardContent>
        </Card>
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
    AIItineraryGenerator,
    RealTimeTransportAvailability,
    GroupTripPlanning,
    RealTimeAdjustmentsPanel,
    LocalProviderDirectory,
    ExpenseSplittingCalculator,
    SmartPackingAssistant,
    CollaborationChat
};
