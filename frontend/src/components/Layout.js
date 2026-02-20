import React, { useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button, Menu, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningIcon from '@mui/icons-material/Warning';
import { aiService } from '../services/aiService';
import { Dialog, DialogTitle, DialogContent, DialogActions, Fab, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon, Paper } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

const Layout = ({ children }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    // SOS State
    const [sosOpen, setSosOpen] = useState(false);
    const [emergencyInfo, setEmergencyInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/login');
    };

    const handleSOS = async () => {
        setSosOpen(true);
        setLoading(true);
        try {
            // In a real app, we'd use navigator.geolocation
            // For now, we use a mock location or "Current Location"
            const result = await aiService.getEmergencyHelp("Paris, France", "Medical Emergency / Feeling unsafe");
            setEmergencyInfo(result);
        } catch (error) {
            console.error('SOS Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard')}
                    >
                        🧳 WanderWise
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/dashboard')}>
                        Itineraries
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/transport')}>
                        Transport
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/expenses')}>
                        Expenses
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/weather')}>
                        Weather
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/memories')}>
                        Memories
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/recommendations')}>
                        AI Insights
                    </Button>
                    <Button
                        color="inherit"
                        onClick={handleMenuOpen}
                        startIcon={<MoreVertIcon />}
                    >
                        More
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
                {children}
            </Container>

            {/* Floating SOS Button */}
            <Fab
                color="error"
                aria-label="SOS"
                sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
                onClick={handleSOS}
            >
                <WarningIcon />
            </Fab>

            {/* Emergency Info Dialog */}
            <Dialog open={sosOpen} onClose={() => setSosOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthAndSafetyIcon /> AI Emergency Assistance
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                            <CircularProgress color="error" />
                            <Typography>Contacting AI Rescue Beacon...</Typography>
                        </Box>
                    ) : emergencyInfo ? (
                        <Box>
                            <Alert severity="error" sx={{ mb: 3, fontWeight: 'bold' }}>
                                Local Emergency: 🚔 {emergencyInfo.numbers?.police} | 🚑 {emergencyInfo.numbers?.ambulance}
                            </Alert>

                            <Typography variant="h6" gutterBottom>🗣️ Local Distress Message</Typography>
                            <Paper sx={{ p: 2, bgcolor: '#fff5f5', border: '1px solid #ffcdd2', mb: 3 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {emergencyInfo.distress_message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    (Show this to a local or authorities if you cannot speak the language)
                                </Typography>
                            </Paper>

                            <Typography variant="h6" gutterBottom>🛡️ Immediate Next Steps</Typography>
                            <List dense>
                                {emergencyInfo.next_steps?.map((step, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemIcon><WarningIcon color="error" size="small" /></ListItemIcon>
                                        <ListItemText primary={step} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ) : (
                        <Typography align="center">Failed to load emergency information. Please call local authorities immediately.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSosOpen(false)} variant="contained" color="error">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Layout;
