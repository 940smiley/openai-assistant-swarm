import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  SmartToy as AssistantIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingIcon,
  Speed as PerformanceIcon,
  PlayArrow as RunIcon,
  Pause as PauseIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useSwarm } from '../../contexts/SwarmContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { state } = useSwarm();
  const { isConnected } = useWebSocket();

  // Calculate statistics
  const totalAssistants = state.assistants.length;
  const runningTasks = state.tasks.filter(task => task.status === 'running').length;
  const completedTasks = state.tasks.filter(task => task.status === 'completed').length;
  const failedTasks = state.tasks.filter(task => task.status === 'failed').length;
  const totalTasks = state.tasks.length;

  // Task status distribution data for pie chart
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#4caf50' },
    { name: 'Running', value: runningTasks, color: '#2196f3' },
    { name: 'Failed', value: failedTasks, color: '#f44336' },
    { name: 'Pending', value: state.tasks.filter(task => task.status === 'pending').length, color: '#ff9800' },
  ].filter(item => item.value > 0);

  // Assistant model distribution
  const modelDistribution = state.assistants.reduce((acc, assistant) => {
    const model = assistant.model || 'Unknown';
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modelData = Object.entries(modelDistribution).map(([model, count]) => ({
    model: model.replace('gpt-', 'GPT-'),
    count,
  }));

  // Recent activity data
  const recentTasks = state.tasks
    .slice(0, 5)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'running':
        return <RunIcon color="primary" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: string;
    trend?: string;
  }> = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card className="card-elevated">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingIcon fontSize="small" color="success" />
                <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Connection Status Banner */}
      {!isConnected && (
        <Card sx={{ mb: 3, bgcolor: 'warning.light' }}>
          <CardContent>
            <Typography variant="h6" color="warning.dark">
              Connection Lost
            </Typography>
            <Typography variant="body2">
              The connection to the swarm server has been lost. Some features may not work correctly.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* API Key Configuration Banner */}
      {!state.apiKeyConfigured && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" color="info.dark">
                  OpenAI API Key Required
                </Typography>
                <Typography variant="body2">
                  Configure your OpenAI API key to start managing assistants and delegating tasks.
                </Typography>
              </Box>
              <Button variant="contained" color="info" href="/configuration">
                Configure Now
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assistants"
            value={totalAssistants}
            subtitle="Available for delegation"
            icon={<AssistantIcon sx={{ fontSize: 40 }} />}
            color="primary"
            trend={totalAssistants > 0 ? "+100%" : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Running Tasks"
            value={runningTasks}
            subtitle="Currently executing"
            icon={<RunIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Tasks"
            value={completedTasks}
            subtitle={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% success rate`}
            icon={<CompletedIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Status"
            value={state.isInitialized ? "Online" : "Offline"}
            subtitle={isConnected ? "Connected" : "Disconnected"}
            icon={<PerformanceIcon sx={{ fontSize: 40 }} />}
            color={state.isInitialized && isConnected ? "success" : "error"}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Task Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Task Status Distribution
              </Typography>
              {taskStatusData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No tasks available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Assistant Model Distribution */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Assistant Models
              </Typography>
              {modelData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssistantIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No assistants configured
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Task Activity
                </Typography>
                <Button variant="outlined" size="small" href="/tasks">
                  View All Tasks
                </Button>
              </Box>
              
              {recentTasks.length > 0 ? (
                <List>
                  {recentTasks.map((task, index) => (
                    <ListItem
                      key={task.id}
                      divider={index < recentTasks.length - 1}
                      sx={{ px: 0 }}
                    >
                      <ListItemIcon>
                        {getStatusIcon(task.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {task.prompt.substring(0, 60)}...
                            </Typography>
                            <Chip
                              label={task.status}
                              size="small"
                              color={getStatusColor(task.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.assistantIds.length} assistant(s)
                            </Typography>
                          </Box>
                        }
                      />
                      {task.status === 'completed' && task.result && (
                        <Tooltip title="View Result">
                          <IconButton size="small">
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No recent task activity
                  </Typography>
                  <Button variant="contained" href="/tasks">
                    Create First Task
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card className="card-elevated">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<TaskIcon />}
                  href="/tasks"
                  disabled={!state.apiKeyConfigured}
                >
                  Delegate New Task
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssistantIcon />}
                  href="/assistants"
                  disabled={!state.apiKeyConfigured}
                >
                  Manage Assistants
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PerformanceIcon />}
                  href="/monitor"
                >
                  Real-time Monitor
                </Button>
              </Box>

              {state.isLoading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Loading...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
