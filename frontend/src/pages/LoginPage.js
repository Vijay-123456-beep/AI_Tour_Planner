import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            login(email, password);
            showSnackbar('Login successful!', 'success');
            navigate('/dashboard');
        } catch (error) {
            showSnackbar(error.message, 'error');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8 }}>
                <Card sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom textAlign="center">
                        Login
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button fullWidth variant="contained" sx={{ mt: 3 }} type="submit">
                            Login
                        </Button>
                    </form>
                </Card>
            </Box>
        </Container>
    );
};

export default LoginPage;
