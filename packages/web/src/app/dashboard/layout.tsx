'use client';

import React from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Badge,
    Avatar,
    Stack
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <AppBar
                    position="static"
                    color="inherit"
                    elevation={0}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Toolbar>
                        <Box sx={{ flexGrow: 1 }} />
                        <Stack direction="row" spacing={2} alignItems="center">
                            <IconButton size="large" color="inherit">
                                <SearchIcon />
                            </IconButton>
                            <IconButton size="large" color="inherit">
                                <Badge badgeContent={4} color="primary">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                            <Box sx={{ width: '1px', height: '24px', bgcolor: 'divider', mx: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                                John Smith
                            </Typography>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>JS</Avatar>
                        </Stack>
                    </Toolbar>
                </AppBar>
                <Box component="main" sx={{ p: 4, flexGrow: 1 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
