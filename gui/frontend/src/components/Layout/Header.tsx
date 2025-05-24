import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSwarm } from '../../contexts/SwarmContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { state, refresh } = useSwarm();
  const { isConnected, connectionStatus } = useWebSocket();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
    handleMenuClose();
  };

  const getRunningTasksCount = () => {
    return state.tasks.filter(task => task.status === 'running').length;
  };

  const getActiveAssistantsCount = () => {
    return state.assistants.length;
  };

  const formatUptime = () => {
    // This would ideally come from the backend
    return 'Online';
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 3, fontWeight: 600 }}>
            Swarm Manager Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<InfoIcon sx={{ fontSize: '1rem' }} />}
              label={`${getActiveAssistantsCount()} Assistants`}
              size="small"
              variant="outlined"
              color="primary"
            />
            
            <Chip
              icon={getRunningTasksCount() > 0 ? <StartIcon sx={{ fontSize: '1rem' }} /> : <StopIcon sx={{ fontSize: '1rem' }} />}
              label={`${getRunningTasksCount()} Running Tasks`}
              size="small"
              variant="outlined"
              color={getRunningTasksCount() > 0 ? 'success' : 'default'}
            />
            
            <Chip
              label={formatUptime()}
              size="small"
              variant="outlined"
              color={isConnected ? 'success' : 'error'}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!state.apiKeyConfigured && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              sx={{ mr: 2 }}
            >
              Configure API Key
            </Button>
          )}

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={getRunningTasksCount()} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh Data">
            <IconButton
              color="inherit"
              onClick={handleRefresh}
              disabled={state.isLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="More Options">
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>
          
          {getRunningTasksCount() === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No active notifications
              </Typography>
            </MenuItem>
          ) : (
            state.tasks
              .filter(task => task.status === 'running')
              .slice(0, 5)
              .map(task => (
                <MenuItem key={task.id} onClick={handleNotificationClose}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Task Running
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.prompt.substring(0, 50)}...
                    </Typography>
                  </Box>
                </MenuItem>
              ))
          )}
        </Menu>

        {/* Options Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleRefresh} disabled={state.isLoading}>
            <RefreshIcon sx={{ mr: 2 }} />
            Refresh All Data
          </MenuItem>
          
          <MenuItem onClick={handleMenuClose}>
            <InfoIcon sx={{ mr: 2 }} />
            About Swarm Manager
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
