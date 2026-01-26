import React from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    Grid,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function LandingPage() {
    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Header / Navbar */}
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -1 }}>
                        WORKFORCE
                    </Typography>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Typography variant="body2" sx={{ cursor: 'pointer', fontWeight: 500 }}>Login</Typography>
                        <Button variant="contained" color="primary">Get Started</Button>
                    </Stack>
                </Stack>
            </Container>

            {/* Hero Section */}
            <Container maxWidth="md" sx={{ pt: 12, pb: 8, textAlign: 'center' }}>
                <Chip
                    label="New: AI-Powered Scheduling is here"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 4, fontWeight: 500 }}
                />
                <Typography variant="h1" gutterBottom sx={{ fontWeight: 800 }}>
                    AI-Powered Workforce Management for <Box component="span" sx={{ color: 'primary.main' }}>Modern Teams</Box>
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 6, maxWidth: '700px', mx: 'auto' }}>
                    Schedule, manage, and engage your flexible workforce with real-time visibility, automated compliance, and complete control.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                        Start Free Trial
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<PlayCircleOutlineIcon />}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                        Watch Demo
                    </Button>
                </Stack>
            </Container>

            {/* Stats Section */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} textAlign="center">
                        {[
                            { val: '90%', label: 'Faster Planning' },
                            { val: '80%', label: 'Fewer Payroll Queries' },
                            { val: '2,000+', label: 'Global Customers' },
                            { val: '1M+', label: 'Shifts Scheduled' }
                        ].map((stat, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stat.val}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Feature Section Preview */}
            <Container maxWidth="lg" sx={{ py: 12 }}>
                <Typography variant="h2" textAlign="center" gutterBottom sx={{ mb: 6, fontWeight: 700 }}>
                    Everything you need to <Box component="span" sx={{ color: 'primary.main' }}>manage your staff</Box>
                </Typography>
                <Grid container spacing={4}>
                    {[
                        {
                            title: 'Flexible Scheduling',
                            desc: 'Built for the dynamic nature of events and staffing. Drag, drop, and notify in seconds.',
                            icon: '🗓️'
                        },
                        {
                            title: 'Compliance & Safety',
                            desc: 'Automatically track UK Working Time Regulations and minimum wage compliance.',
                            icon: '⚖️'
                        },
                        {
                            title: 'Worker Engagement',
                            desc: 'Full-featured mobile portal for staff to view shifts, apply, and clock in.',
                            icon: '📱'
                        }
                    ].map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card sx={{
                                height: '100%',
                                p: 3,
                                borderRadius: 4,
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-10px)', boxShadow: 10 }
                            }}>
                                <Typography variant="h4" sx={{ mb: 2 }}>{feature.icon}</Typography>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {feature.desc}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}
