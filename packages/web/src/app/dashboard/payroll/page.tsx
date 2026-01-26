'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    TextField
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { usePayroll } from '@/lib/hooks';
import { PayrollResult } from '@/types';

export default function PayrollPage() {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString()); // First of month
    const [endDate, setEndDate] = useState(new Date().toISOString());

    const { payroll, summary, isLoading, isError } = usePayroll(startDate, endDate);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Payroll Center</Typography>
                    <Typography color="text.secondary">Calculate earnings, UK tax (PAYE), and National Insurance deductions.</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<AssessmentIcon />} sx={{ borderRadius: 2 }}>Summary Report</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2 }}>Export CSV for Bank</Button>
                </Stack>
            </Stack>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
                <Stack direction="row" spacing={3} alignItems="center">
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate.split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={endDate.split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </Paper>

            {isError && <Alert severity="error" sx={{ mb: 3 }}>Failed to calculate payroll.</Alert>}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {[
                    { title: 'Total Gross Pay', value: `£${(summary.totalGrossPay || 0).toLocaleString()}`, color: 'primary.main' },
                    { title: 'Total Tax (PAYE)', value: `£${(summary.totalPAYE || 0).toLocaleString()}`, color: 'error.main' },
                    { title: 'Total NI', value: `£${(summary.totalNI || 0).toLocaleString()}`, color: 'warning.main' },
                    { title: 'Net Disbursement', value: `£${(summary.totalNetPay || 0).toLocaleString()}`, color: 'success.main' }
                ].map((item, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: item.color }}>
                                    {item.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Payroll Table */}
            <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.01)', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Period Breakdown
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Staff Member</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Regular Hours</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Overtime</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Rate</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Gross Pay</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tax (PAYE)</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Net Pay</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : payroll.map((row: PayrollResult, i: number) => (
                                <TableRow key={i} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.workerName}</TableCell>
                                    <TableCell>{row.regularHours}h</TableCell>
                                    <TableCell>{row.overtimeHours}h</TableCell>
                                    <TableCell>£{row.hourlyRate}/hr</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>£{row.grossPay.toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>-£{row.paye.toFixed(2)}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'success.main', bgcolor: 'rgba(76, 175, 80, 0.04)' }}>
                                        £{row.netPay.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
