'use client';

import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Grid,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import { useShifts } from '@/lib/hooks';
import { Shift } from '@/types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulingPage() {
    const { shifts, isLoading, isError } = useShifts();

    const getShiftsForDay = (dayName: string) => {
        return shifts.filter((s: Shift) => {
            const date = new Date(s.startTime);
            return date.toLocaleDateString('en-US', { weekday: 'long' }) === dayName;
        });
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Shift Schedule</Typography>
                    <Typography color="text.secondary">Create, publish, and manage worker assignments.</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2 }}>Export</Button>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>Create Shift</Button>
                </Stack>
            </Stack>

            {isError && <Alert severity="error" sx={{ mb: 3 }}>Failed to load schedules.</Alert>}

            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small"><ChevronLeftIcon /></IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Current Week</Typography>
                        <IconButton size="small"><ChevronRightIcon /></IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button variant="contained" disableElevation sx={{ bgcolor: 'rgba(45, 63, 226, 0.1)', color: 'primary.main', fontWeight: 700 }}>Week</Button>
                        <Button variant="text" color="inherit">Month</Button>
                    </Stack>
                </Stack>

                <Grid container spacing={0} sx={{ borderTop: '1px solid', borderLeft: '1px solid', borderColor: 'divider' }}>
                    {days.map((day) => (
                        <Grid item xs key={day} sx={{ minHeight: 600, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    {day}
                                </Typography>
                            </Box>

                            <Box sx={{ p: 1 }}>
                                {isLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress size={20} />
                                    </Box>
                                ) : (
                                    getShiftsForDay(day).map((shift: Shift) => (
                                        <Paper
                                            key={shift._id}
                                            elevation={0}
                                            sx={{
                                                p: 1.5, mb: 1.5, borderRadius: 2,
                                                bgcolor: 'background.default',
                                                borderLeft: `4px solid #2D3FE2`,
                                                cursor: 'pointer',
                                                '&:hover': { transform: 'scale(1.02)' },
                                                transition: '0.2s',
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                                                {shift.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {shift.assignedWorkers?.length || 0} / {shift.capacity} Filled
                                            </Typography>
                                        </Paper>
                                    ))
                                )}

                                <Button
                                    fullWidth
                                    variant="text"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        py: 1,
                                        color: 'text.secondary',
                                        opacity: 0.5,
                                        mt: 1,
                                        '&:hover': { opacity: 1, borderColor: 'primary.main', color: 'primary.main' }
                                    }}
                                >
                                    Shift
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
}
