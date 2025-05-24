import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SmartToy as AssistantsIcon,
  Assignment as TasksIcon,
  MonitorHeart as MonitorIcon,
  Settings as SettingsIcon,
  Hub as SwarmIcon,
} from '@mui/icons-material';
import { useSwarm } from '../../contexts/SwarmContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface SidebarProps {
  drawerWidth: number;
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/assistants', label: 'Assistants', icon: AssistantsIcon },
  { path: '/tasks', label: 'Task Delegation', icon: TasksIcon },
  { path: '/monitor', label: 'Real-time Monitor', icon: MonitorIcon },
  { path: '/configuration', label: 'Configuration', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSwarm();
  const { isConnected, connectionStatus } = useWebSocket();

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Disconnected';
      default:
        return 'Offline';
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              mr: 2,
              width: 40,
              height: 40,
            }}
          >
            <SwarmIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              OpenAI Swarm
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Assistant Manager
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box sx={{ px: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Connection Status
          </Typography>
          <Chip
            label={getConnectionStatusText()}
            color={getConnectionStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            backgroundColor: state.isInitialized ? 'success.light' : 'warning.light',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Swarm Status
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {state.isInitialized ? 'Initialized & Ready' : 'Not Initialized'}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">
              Assistants: {state.assistants.length}
            </Typography>
            <Typography variant="caption">
              Tasks: {state.tasks.length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
