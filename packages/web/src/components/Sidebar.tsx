'use client';

import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Schedules', icon: <CalendarMonthIcon />, path: '/dashboard/schedules' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/dashboard/staff' },
    { text: 'Time Tracking', icon: <AccessTimeIcon />, path: '/dashboard/time-tracking' },
    { text: 'Payroll', icon: <PaymentsIcon />, path: '/dashboard/payroll' },
];

export default function Sidebar() {
    return (
        <Box sx={{
            width: 260,
            height: '100vh',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    WORKFORCE
                </Typography>
            </Box>

            <List sx={{ flexGrow: 1, px: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton sx={{
                            borderRadius: 2,
                            '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                            '&:hover': { bgcolor: 'rgba(45, 63, 226, 0.04)' }
                        }}>
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider />

            <Box sx={{ p: 2 }}>
                <ListItemButton sx={{ borderRadius: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItemButton>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', p: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>JS</Avatar>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>John Smith</Typography>
                        <Typography variant="caption" color="text.secondary">Admin</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
