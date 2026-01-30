import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to AI Tour Planner
                </Typography>
                <Typography variant="h6" color="textSecondary" paragraph>
                    Plan your perfect trip with AI-powered recommendations
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ mr: 2 }}>
                        Login
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate('/register')}>
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default HomePage;
