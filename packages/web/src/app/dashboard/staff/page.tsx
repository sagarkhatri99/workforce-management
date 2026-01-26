'use client';

import React, { useState } from 'react';
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
    Avatar,
    Chip,
    IconButton,
    Stack,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useStaff } from '@/lib/hooks';
import { User } from '@/types';

export default function StaffPage() {
    const { staff, isLoading, isError } = useStaff();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStaff = staff.filter((member: User) =>
        member.name.first.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.name.last.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Staff Management</Typography>
                    <Typography color="text.secondary">Manage your workforce, roles, and location assignments.</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<MailOutlineIcon />} sx={{ borderRadius: 2 }}>Export CSV</Button>
                    <Button variant="contained" sx={{ borderRadius: 2 }}>+ Invite Member</Button>
                </Stack>
            </Stack>

            {isError && (
                <Alert severity="error" sx={{ mb: 3 }}>Failed to load staff members. Please try again later.</Alert>
            )}

            <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search staff members..."
                        size="small"
                        sx={{ flexGrow: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2 }
                        }}
                    />
                    <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2 }}>Filters</Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={24} sx={{ mr: 2 }} />
                                        <Typography variant="body2" component="span">Loading staff...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">No staff members found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.map((member: User) => (
                                <TableRow key={member._id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{
                                                width: 32, height: 32,
                                                bgcolor: 'secondary.light',
                                                color: 'secondary.main',
                                                fontWeight: 700,
                                                fontSize: '0.8rem'
                                            }}>
                                                {member.name.first[0]?.toUpperCase()}{member.name.last[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {member.name.first} {member.name.last}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{member.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={member.role}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontWeight: 600,
                                                borderRadius: 1.5,
                                                textTransform: 'capitalize',
                                                color: member.role === 'admin' ? 'primary.main' : 'text.primary',
                                                borderColor: member.role === 'admin' ? 'primary.main' : 'divider'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: member.status === 'active' ? 'success.main' : 'error.main'
                                            }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small"><MoreVertIcon /></IconButton>
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
