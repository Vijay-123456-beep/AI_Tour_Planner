import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, isAfter } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import api from '../../services/api';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const TransportSection = ({ destination, onTransportBooked }) => {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [transportOptions, setTransportOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [travelers, setTravelers] = useState(1);
  const [startDate, setStartDate] = useState(addDays(new Date(), 7));
  const [endDate, setEndDate] = useState(addDays(new Date(), 10));
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const getTransportIcon = (type) => {
    switch (type) {
      case 'jeep':
        return <DirectionsCarIcon color="primary" fontSize="large" />;
      case 'car':
        return <LocalTaxiIcon color="primary" fontSize="large" />;
      case 'bike':
        return <TwoWheelerIcon color="primary" fontSize="large" />;
      default:
        return <DirectionsCarIcon color="primary" fontSize="large" />;
    }
  };

  const fetchTransportOptions = async () => {
    if (!destination) return;
    
    setLoading(true);
    try {
      const response = await api.get('/api/transport/options', {
        params: {
          destination: destination,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          travelers: travelers
        }
      });
      
      if (response.data.success) {
        setTransportOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transport options:', error);
      showSnackbar('Failed to load transport options', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTransport = async (option) => {
    if (!currentUser) {
      showSnackbar('Please log in to book transport', 'warning');
      return;
    }
    
    try {
      const response = await api.post('/api/transport/book', {
        provider_id: option.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        travelers: travelers
      });
      
      if (response.data.success) {
        setBookingDetails(response.data.data);
        setBookingDialogOpen(true);
        onTransportBooked?.(response.data.data);
        showSnackbar('Transport booked successfully!', 'success');
      }
    } catch (error) {
      console.error('Error booking transport:', error);
      showSnackbar(
        error.response?.data?.error || 'Failed to book transport', 
        'error'
      );
    }
  };

  useEffect(() => {
    if (destination && startDate && endDate && travelers > 0) {
      const timer = setTimeout(() => {
        fetchTransportOptions();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [destination, startDate, endDate, travelers]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    // If end date is before the new start date, adjust it
    if (isAfter(date, endDate)) {
      setEndDate(addDays(date, 1));
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        <DirectionsCarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Transport Options for {destination}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        We've found local transport providers that can help you explore {destination} and surrounding areas.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            minDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            minDate={startDate || new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
        </LocalizationProvider>
        
        <TextField
          label="Travelers"
          type="number"
          value={travelers}
          onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
          size="small"
          sx={{ width: '120px' }}
          inputProps={{ min: 1 }}
        />
      </Box>
      
      {loading ? (
        <Typography>Loading transport options...</Typography>
      ) : transportOptions.length > 0 ? (
        <Grid container spacing={3}>
          {transportOptions.map((option) => (
            <Grid item xs={12} md={6} key={option.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getTransportIcon(option.type)}
                    <Typography variant="h6" component="div" sx={{ ml: 2, flexGrow: 1 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{option.price_per_day}/day
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {option.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      icon={<PhoneIcon fontSize="small" />} 
                      label={option.contact} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Max ${option.max_capacity} travelers`} 
                      size="small" 
                      variant="outlined"
                    />
                    {option.features?.map((feature, index) => (
                      <Chip 
                        key={index} 
                        label={feature} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title="View more details">
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <InfoOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleBookTransport(option)}
                    disabled={!currentUser}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No transport options found for the selected dates. Try adjusting your search criteria.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={fetchTransportOptions}
          >
            Refresh Results
          </Button>
        </Box>
      )}
      
      <Dialog 
        open={bookingDialogOpen} 
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Booking Confirmed!</DialogTitle>
        <DialogContent>
          {bookingDetails && (
            <>
              <Typography variant="h6" gutterBottom>
                {bookingDetails.provider_name}
              </Typography>
              <Typography variant="body1" paragraph>
                Your transport has been successfully booked for your trip to {destination}.
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking Details:
                </Typography>
                <Typography>From: {new Date(bookingDetails.start_date).toLocaleDateString()}</Typography>
                <Typography>To: {new Date(bookingDetails.end_date).toLocaleDateString()}</Typography>
                <Typography>Travelers: {bookingDetails.travelers}</Typography>
                <Typography>Total: ₹{bookingDetails.total_price}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                  You'll receive a confirmation email with all the details shortly.
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setBookingDialogOpen(false);
              // Navigate to bookings page or show user's bookings
            }}
          >
            View My Bookings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportSection;
