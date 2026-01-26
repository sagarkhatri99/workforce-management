'use client';

import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTimeEntries } from '@/lib/hooks';
import { api } from '@/lib/api';
import { TimeEntry, User, Location } from '@/types';

export default function TimeTrackingPage() {
    const { entries, isLoading, isError, mutate } = useTimeEntries();

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/timeclock/entries/${id}/approve`);
            mutate();
        } catch (err) {
            console.error('Approval failed', err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.put(`/timeclock/entries/${id}/reject`, { notes: 'Rejected by manager' });
            mutate();
        } catch (err) {
            console.error('Rejection failed', err);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Time Tracking</Typography>
                    <Typography color="text.secondary">Review, flag, and approve work hours with GPS verification.</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<HistoryIcon />} sx={{ borderRadius: 2 }}>History</Button>
                    <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>Approve All</Button>
                </Stack>
            </Stack>

            {isError && <Alert severity="error" sx={{ mb: 3 }}>Failed to load time entries.</Alert>}

            <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Worker</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Location / Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Clock In/Out</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total Time</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Verification</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">No time entries found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : entries.map((entry: TimeEntry) => {
                                const worker = entry.workerId as User;
                                const location = entry.locationId as Location;
                                return (
                                    <TableRow key={entry._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {worker.name?.first} {worker.name?.last}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">ID: {entry._id.slice(-6)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{location?.name || 'Unknown'}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(entry.clockIn.time).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {new Date(entry.clockIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.5 }}>→</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {entry.clockOut ? new Date(entry.clockOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {entry.totalMinutes ? `${Math.floor(entry.totalMinutes / 60)}h ${entry.totalMinutes % 60}m` : '--'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title={entry.clockIn.withinFence ? "Verified within Geofence" : "Outside Geofence"}>
                                                    <LocationOnIcon fontSize="small" sx={{ color: entry.clockIn.withinFence ? 'success.main' : 'error.main' }} />
                                                </Tooltip>
                                                {entry.flaggedForReview && (
                                                    <Tooltip title="Manually flagged or accuracy low">
                                                        <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={entry.status.replace('_', ' ')}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    textTransform: 'capitalize',
                                                    bgcolor: entry.status === 'approved' ? 'success.light' : (entry.status === 'rejected' ? 'error.light' : 'warning.light'),
                                                    color: entry.status === 'approved' ? 'success.main' : (entry.status === 'rejected' ? 'error.main' : 'warning.main'),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                {(entry.status === 'clocked_out' || entry.status === 'clocked_in') && (
                                                    <>
                                                        <IconButton size="small" color="success" onClick={() => handleApprove(entry._id)}>
                                                            <CheckCircleIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleReject(entry._id)}>
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
