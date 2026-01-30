import React, { useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button, Menu, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Layout = ({ children }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

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
        </Box>
    );
};

export default Layout;
