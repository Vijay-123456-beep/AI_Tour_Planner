import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card } from '@mui/material';

const RegisterPage = () => {
    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8 }}>
                <Card sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom textAlign="center">
                        Register
                    </Typography>
                    <form>
                        <TextField fullWidth label="Name" margin="normal" required />
                        <TextField fullWidth label="Email" type="email" margin="normal" required />
                        <TextField fullWidth label="Password" type="password" margin="normal" required />
                        <Button fullWidth variant="contained" sx={{ mt: 3 }}>
                            Register
                        </Button>
                    </form>
                </Card>
            </Box>
        </Container>
    );
};

export default RegisterPage;
