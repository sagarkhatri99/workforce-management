'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Link,
    Stack,
    Grid,
    Alert
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth.service';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        organizationName: '',
        organizationSlug: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await authService.register(formData);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            bgcolor: 'background.default'
        }}>
            {/* Right Side: Info Panel */}
            <Box sx={{
                flex: 1,
                bgcolor: '#00D1FF',
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                p: 8,
                position: 'relative',
                overflow: 'hidden',
                order: { md: 2 }
            }}>
                <Box sx={{ zIndex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                        Manage Your <br />Staff in One Place
                    </Typography>
                    <ul style={{ padding: 0, listStyle: 'none' }}>
                        {['Multi-tenant security', 'Automatic GPS validation', 'UK Payroll integration'].map((text) => (
                            <li key={text} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 24, height: 24, bgcolor: 'white', color: '#00D1FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, fontWeight: 800 }}>✓</Box>
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>{text}</Typography>
                            </li>
                        ))}
                    </ul>
                </Box>
            </Box>

            {/* Left Side: Register Form */}
            <Container maxWidth="sm" sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 4,
                py: 8,
                order: { md: 1 }
            }}>
                <Box sx={{ mb: 4 }}>
                    <Link href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'text.secondary', mb: 4 }}>
                        <ChevronLeftIcon fontSize="small" />
                        <Typography variant="body2">Back to website</Typography>
                    </Link>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Create account</Typography>
                    <Typography color="text.secondary">Start your workforce management journey today.</Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Stack spacing={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: -2 }}>Organization Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Company Name"
                                variant="outlined"
                                fullWidth
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Org ID / Slug"
                                variant="outlined"
                                fullWidth
                                name="organizationSlug"
                                placeholder="my-company"
                                value={formData.organizationSlug}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: -2 }}>Admin Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="First Name"
                                variant="outlined"
                                fullWidth
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Last Name"
                                variant="outlined"
                                fullWidth
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="Work Email"
                        variant="outlined"
                        fullWidth
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <Button
                        variant="contained"
                        size="large"
                        disabled={loading}
                        onClick={handleSubmit}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, mt: 2 }}
                    >
                        {loading ? 'Creating Account...' : 'Create My Account'}
                    </Button>
                </Stack>

                <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
                    Already have an account? {' '}
                    <Link href="/login" sx={{ fontWeight: 700, textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </Typography>
            </Container>
        </Box>
    );
}
