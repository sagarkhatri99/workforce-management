'use client';

import React from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Link,
    Stack,
    InputAdornment,
    IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth.service';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [orgSlug, setOrgSlug] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async () => {
        if (!email || !password || !orgSlug) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.login({ email, password, organizationSlug: orgSlug });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
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
            {/* Left Side: Image/Branding (Hidden on mobile) */}
            <Box sx={{
                flex: 1,
                bgcolor: 'primary.main',
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                p: 8,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{ zIndex: 1, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                        Empowering the <br />Future of Work
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
                        The all-in-one workforce management platform <br />built for staffing and event teams.
                    </Typography>
                </Box>
                {/* Decorative Circles */}
                <Box sx={{
                    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)', top: -100, left: -100
                }} />
                <Box sx={{
                    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.05)', bottom: -200, right: -200
                }} />
            </Box>

            {/* Right Side: Login Form */}
            <Container maxWidth="xs" sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 4
            }}>
                <Box sx={{ mb: 4 }}>
                    <Link href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'text.secondary', mb: 4 }}>
                        <ChevronLeftIcon fontSize="small" />
                        <Typography variant="body2">Back to website</Typography>
                    </Link>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Welcome back</Typography>
                    <Typography color="text.secondary">Enter your details to access your account.</Typography>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Typography>
                )}

                <Stack spacing={3}>
                    <TextField
                        label="Organization ID (Slug)"
                        variant="outlined"
                        fullWidth
                        placeholder="my-company"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value)}
                    />
                    <TextField
                        label="Email Address"
                        variant="outlined"
                        fullWidth
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Box>
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Link href="#" variant="body2" sx={{ display: 'block', mt: 1, textAlign: 'right', fontWeight: 500 }}>
                            Forgot password?
                        </Link>
                    </Box>
                    <Button
                        variant="contained"
                        size="large"
                        disabled={loading}
                        onClick={handleSubmit}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </Stack>

                <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
                    Don't have an account? {' '}
                    <Link href="/register" sx={{ fontWeight: 700, textDecoration: 'none' }}>
                        Register your organization
                    </Link>
                </Typography>
            </Container>
        </Box>
    );
}
