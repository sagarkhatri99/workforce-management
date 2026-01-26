'use client';

import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Stack,
    Button,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useStaff, useShifts, useTimeEntries } from '@/lib/hooks';
import { TimeEntry, User } from '@/types';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
    trend?: number;
}

const StatCard = ({ title, value, icon, color, trend }: StatCardProps) => (
    <Card sx={{ height: '100%', borderRadius: 4 }}>
        <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex' }}>
                    {icon}
                </Box>
                {trend && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'success.main' }}>
                        <TrendingUpIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{trend}%</Typography>
                    </Stack>
                )}
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
        </CardContent>
    </Card>
);

export default function DashboardOverview() {
    const { staff, isLoading: staffLoading } = useStaff();
    const { shifts, isLoading: shiftsLoading } = useShifts();
    const { entries, isLoading: entriesLoading } = useTimeEntries();

    const isLoading = staffLoading || shiftsLoading || entriesLoading;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const clockedInCount = entries.filter((e: TimeEntry) => e.status === 'clocked_in').length;
    const approvedCount = entries.filter((e: TimeEntry) => e.status === 'approved').length;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Dashboard Overview</Typography>
                    <Typography color="text.secondary">Real-time workplace insights from your connected API.</Typography>
                </Box>
                <Button variant="contained" size="large" sx={{ borderRadius: 2 }}>+ Create Shift</Button>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Staff" value={staff.length} icon={<PeopleAltIcon />} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Shifts" value={shifts.length} icon={<AccessTimeFilledIcon />} color="secondary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Clocked In" value={clockedInCount} icon={<TrendingUpIcon />} color="info" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Approved Entries" value={approvedCount} icon={<CheckCircleIcon />} color="success" />
                </Grid>

                {/* Recently Active */}
                <Grid item xs={12} md={12}>
                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Recent Activity</Typography>
                        <Stack spacing={2}>
                            {entries.slice(0, 5).map((entry: TimeEntry) => {
                                const worker = entry.workerId as User;
                                return (
                                    <Stack key={entry._id} direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {worker.name?.first} {worker.name?.last}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(entry.clockIn.time).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 700,
                                                bgcolor: entry.status === 'approved' ? 'success.light' : 'warning.light',
                                                color: entry.status === 'approved' ? 'success.main' : 'warning.main',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {entry.status.replace('_', ' ')}
                                        </Typography>
                                    </Stack>
                                );
                            })}
                            {entries.length === 0 && (
                                <Typography color="text.secondary">No recent activity found.</Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
