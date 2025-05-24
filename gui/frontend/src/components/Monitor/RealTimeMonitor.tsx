import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Monitor as MonitorIcon,
  Timeline as TimelineIcon,
  Speed as MetricsIcon,
  Notifications as NotificationIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useSwarm } from '../../contexts/SwarmContext';

interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  data?: any;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface SystemMetric {
  timestamp: string;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  assistantCount: number;
}

const RealTimeMonitor: React.FC = () => {
  const { lastMessage, isConnected, connectionStatus } = useWebSocket();
  const { state } = useSwarm();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [maxLogs, setMaxLogs] = useState(100);

  // Add new activity log entry
  const addActivityLog = (type: string, message: string, data?: any, severity: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      severity,
    };

    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      return updated.slice(0, maxLogs);
    });
  };

  // Update system metrics
  const updateSystemMetrics = () => {
    const metric: SystemMetric = {
      timestamp: new Date().toISOString(),
      activeTasks: state.tasks.filter(task => task.status === 'running').length,
      completedTasks: state.tasks.filter(task => task.status === 'completed').length,
      failedTasks: state.tasks.filter(task => task.status === 'failed').length,
      assistantCount: state.assistants.length,
    };

    setSystemMetrics(prev => {
      const updated = [...prev, metric];
      return updated.slice(-20); // Keep last 20 metrics
    });
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;
    
    switch (type) {
      case 'connected':
        addActivityLog('connection', 'Connected to swarm server', data, 'success');
        break;
      case 'swarm-initialized':
        addActivityLog('swarm', 'Swarm manager initialized successfully', data, 'success');
        break;
      case 'swarm-error':
        addActivityLog('swarm', `Swarm error: ${data?.error}`, data, 'error');
        break;
      case 'task-started':
        addActivityLog('task', `Task started: ${data?.prompt?.substring(0, 50)}...`, data, 'info');
        break;
      case 'task-completed':
        addActivityLog('task', `Task completed successfully`, data, 'success');
        break;
      case 'task-error':
        addActivityLog('task', `Task failed: ${data?.error}`, data, 'error');
        break;
      case 'parent-assistant-complete':
        addActivityLog('assistant', 'Parent assistant completed task delegation', data, 'info');
        break;
      case 'child-assistants-complete':
        addActivityLog('assistant', `Child assistants completed (${data?.subRuns?.length} results)`, data, 'success');
        break;
      case 'poll-event':
        if (data?.status) {
          addActivityLog('poll', `Status update: ${data.status}`, data, 'info');
        }
        break;
      case 'assistant-created':
        addActivityLog('assistant', `Assistant created: ${data?.name}`, data, 'success');
        break;
      case 'assistant-updated':
        addActivityLog('assistant', `Assistant updated: ${data?.name}`, data, 'info');
        break;
      case 'assistant-deleted':
        addActivityLog('assistant', `Assistant deleted`, data, 'warning');
        break;
      case 'config-updated':
        addActivityLog('config', 'Configuration updated', data, 'info');
        break;
      default:
        addActivityLog('system', `Unknown event: ${type}`, data, 'info');
    }

    updateSystemMetrics();
  }, [lastMessage]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [state]);

  const handleClearLogs = () => {
    setActivityLogs([]);
  };

  const handleDownloadLogs = () => {
    const logData = activityLogs.map(log => ({
      timestamp: log.timestamp,
      type: log.type,
      message: log.message,
      severity: log.severity,
      data: log.data,
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swarm-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CompletedIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <PauseIcon color="warning" />;
      default:
        return <StartIcon color="primary" />;
    }
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const filteredLogs = showOnlyErrors 
    ? activityLogs.filter(log => log.severity === 'error')
    : activityLogs;

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Real-time Monitor
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={connectionStatus === 'connected' ? <CheckCircle /> : <ErrorIcon />}
            label={connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Real-time monitoring is not available. The connection to the swarm server has been lost.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Metrics Chart */}
        <Grid item xs={12} lg={8}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MetricsIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    System Metrics
                  </Typography>
                </Box>
                <Tooltip title="Refresh Metrics">
                  <IconButton onClick={updateSystemMetrics}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {systemMetrics.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={systemMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm:ss')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="activeTasks" 
                        stackId="1" 
                        stroke="#2196f3" 
                        fill="#2196f3" 
                        name="Active Tasks"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completedTasks" 
                        stackId="1" 
                        stroke="#4caf50" 
                        fill="#4caf50" 
                        name="Completed Tasks"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failedTasks" 
                        stackId="1" 
                        stroke="#f44336" 
                        fill="#f44336" 
                        name="Failed Tasks"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No metrics data available yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12} lg={4}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MonitorIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Current Status
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Connection</Typography>
                  <Chip
                    label={isConnected ? 'Connected' : 'Disconnected'}
                    color={isConnected ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Swarm Status</Typography>
                  <Chip
                    label={state.isInitialized ? 'Initialized' : 'Not Ready'}
                    color={state.isInitialized ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Active Tasks</Typography>
                  <Typography variant="h6" color="primary.main">
                    {state.tasks.filter(task => task.status === 'running').length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Total Assistants</Typography>
                  <Typography variant="h6" color="info.main">
                    {state.assistants.length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="h6" color="success.main">
                    {state.tasks.length > 0 
                      ? Math.round((state.tasks.filter(t => t.status === 'completed').length / state.tasks.length) * 100)
                      : 0}%
                  </Typography>
                </Box>

                {state.isLoading && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      System Loading...
                    </Typography>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Log */}
        <Grid item xs={12}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Activity Log
                  </Typography>
                  <Chip label={filteredLogs.length} size="small" />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOnlyErrors}
                        onChange={(e) => setShowOnlyErrors(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Errors Only"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto Scroll"
                  />

                  <Tooltip title="Download Logs">
                    <IconButton onClick={handleDownloadLogs} disabled={activityLogs.length === 0}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Clear Logs">
                    <IconButton onClick={handleClearLogs} disabled={activityLogs.length === 0}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Paper sx={{ maxHeight: 400, overflow: 'auto', backgroundColor: 'background.default' }}>
                {filteredLogs.length > 0 ? (
                  <List dense>
                    {filteredLogs.map((log, index) => (
                      <ListItem
                        key={log.id}
                        divider={index < filteredLogs.length - 1}
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                          {getStatusIcon(log.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {log.message}
                              </Typography>
                              <Chip
                                label={log.type}
                                size="small"
                                color={getStatusColor(log.severity) as any}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      {showOnlyErrors ? 'No error logs to display' : 'No activity logs yet'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeMonitor;
