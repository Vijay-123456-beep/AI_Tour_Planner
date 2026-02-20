import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card, Divider, InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import GoogleIcon from '@mui/icons-material/Google';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, register, googleLogin } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        mobile: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                if (!formData.fullName || !formData.email || !formData.password || !formData.mobile) {
                    throw new Error('Please fill in all fields');
                }
                await register(formData);
                showSnackbar('Registration successful! Please login.', 'success');
                setIsRegister(false); // Switch to login
            } else {
                await login(formData.email, formData.password);
                showSnackbar('Login successful!', 'success');
                navigate('/dashboard');
            }
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await googleLogin();
            showSnackbar('Signed in with Google!', 'success');
            navigate('/dashboard');
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h3" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                    AI Tour Planner
                </Typography>
                <Card sx={{ p: 4, width: '100%', borderRadius: 4, boxShadow: 3 }}>
                    <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        {isRegister && (
                            <>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Mobile Number"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                />
                            </>
                        )}

                        <TextField
                            fullWidth
                            label="Email Address (Gmail, etc.)"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2, borderRadius: 2, height: 48 }}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (isRegister ? 'Registering...' : 'Logging In...') : (isRegister ? 'Register' : 'Login')}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2 }}>OR</Divider>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        sx={{ mt: 1, mb: 2, borderRadius: 2, height: 48 }}
                    >
                        Sign in with Google
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {isRegister ? "Already have an account?" : "Don't have an account?"}
                            <Button
                                onClick={() => setIsRegister(!isRegister)}
                                sx={{ ml: 1, textTransform: 'none', fontWeight: 'bold' }}
                            >
                                {isRegister ? "Login here" : "Register now"}
                            </Button>
                        </Typography>
                    </Box>
                </Card>
            </Box>
        </Container>
    );
};

export default LoginPage;
