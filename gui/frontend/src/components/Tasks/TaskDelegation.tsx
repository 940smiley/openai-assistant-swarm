import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send as SendIcon,
  Assignment as TaskIcon,
  SmartToy as AssistantIcon,
  Schedule as PendingIcon,
  PlayArrow as RunningIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSwarm } from '../../contexts/SwarmContext';
import toast from 'react-hot-toast';

const TaskDelegation: React.FC = () => {
  const { state, delegateTask } = useSwarm();
  const [prompt, setPrompt] = useState('');
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>(['<any>']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelegateTask = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    try {
      setIsSubmitting(true);
      await delegateTask(prompt.trim(), selectedAssistants);
      setPrompt('');
      setSelectedAssistants(['<any>']);
      toast.success('Task delegation started successfully');
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'running':
        return <RunningIcon color="primary" />;
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatResult = (result: any) => {
    if (!result) return 'No result available';
    
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(params.value)}
          <Chip
            label={params.value}
            size="small"
            color={getStatusColor(params.value) as any}
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: 'prompt',
      headerName: 'Task Description',
      width: 400,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'assistantIds',
      headerName: 'Assistants',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.includes('<any>') ? 'Any Available' : `${params.value.length} Selected`}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {format(new Date(params.value), 'MMM dd, HH:mm')}
        </Typography>
      ),
    },
  ];

  if (!state.apiKeyConfigured) {
    return (
      <Box className="fade-in">
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            OpenAI API Key Required
          </Typography>
          <Typography>
            Please configure your OpenAI API key in the Configuration section to delegate tasks.
          </Typography>
          <Button variant="contained" href="/configuration" sx={{ mt: 2 }}>
            Configure API Key
          </Button>
        </Alert>
      </Box>
    );
  }

  const runningTasks = state.tasks.filter(task => task.status === 'running');
  const completedTasks = state.tasks.filter(task => task.status === 'completed');
  const failedTasks = state.tasks.filter(task => task.status === 'failed');

  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Task Delegation
      </Typography>

      <Grid container spacing={3}>
        {/* Task Creation Form */}
        <Grid item xs={12} lg={8}>
          <Card className="card-elevated">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Delegate New Task
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Task Description"
                  placeholder="Describe the task you want to delegate to your assistants. Be specific about what you need accomplished..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Assistants</InputLabel>
                  <Select
                    multiple
                    value={selectedAssistants}
                    onChange={(e) => setSelectedAssistants(e.target.value as string[])}
                    label="Select Assistants"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              value === '<any>'
                                ? 'Any Available'
                                : state.assistants.find(a => a.id === value)?.name || value
                            }
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="<any>">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssistantIcon fontSize="small" />
                        Any Available Assistant
                      </Box>
                    </MenuItem>
                    <Divider />
                    {state.assistants.map((assistant) => (
                      <MenuItem key={assistant.id} value={assistant.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssistantIcon fontSize="small" />
                          {assistant.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleDelegateTask}
                  disabled={!prompt.trim() || isSubmitting || state.assistants.length === 0}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {isSubmitting ? 'Delegating Task...' : 'Delegate Task'}
                </Button>

                {state.assistants.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      No assistants available. Create some assistants first to delegate tasks.
                    </Typography>
                    <Button variant="outlined" href="/assistants" sx={{ mt: 1 }}>
                      Create Assistants
                    </Button>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Statistics */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card className="card-elevated">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Task Statistics
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RunningIcon color="primary" />
                      <Typography variant="body2">Running</Typography>
                    </Box>
                    <Typography variant="h6" color="primary.main">
                      {runningTasks.length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompletedIcon color="success" />
                      <Typography variant="body2">Completed</Typography>
                    </Box>
                    <Typography variant="h6" color="success.main">
                      {completedTasks.length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      <Typography variant="body2">Failed</Typography>
                    </Box>
                    <Typography variant="h6" color="error.main">
                      {failedTasks.length}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Total Tasks
                    </Typography>
                    <Typography variant="h6">
                      {state.tasks.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Running Tasks */}
            {runningTasks.length > 0 && (
              <Card className="card-elevated">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Currently Running
                  </Typography>
                  
                  <List dense>
                    {runningTasks.slice(0, 3).map((task, index) => (
                      <ListItem key={task.id} divider={index < runningTasks.length - 1}>
                        <ListItemIcon>
                          <RunningIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.prompt.substring(0, 40) + '...'}
                          secondary={format(new Date(task.createdAt), 'HH:mm')}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {runningTasks.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      +{runningTasks.length - 3} more running tasks
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>

        {/* Task History */}
        <Grid item xs={12}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Task History
                </Typography>
                <Tooltip title="Refresh Tasks">
                  <IconButton onClick={() => window.location.reload()}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={state.tasks}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  loading={state.isLoading}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-cell': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'background.default',
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Results */}
        {state.tasks.filter(task => task.status === 'completed' || task.status === 'failed').length > 0 && (
          <Grid item xs={12}>
            <Card className="card-elevated">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recent Task Results
                </Typography>
                
                {state.tasks
                  .filter(task => task.status === 'completed' || task.status === 'failed')
                  .slice(0, 3)
                  .map((task) => (
                    <Accordion key={task.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          {getStatusIcon(task.status)}
                          <Typography sx={{ flexGrow: 1 }}>
                            {task.prompt}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {task.status === 'completed' && task.result ? (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Result:
                            </Typography>
                            <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                              <SyntaxHighlighter
                                language="json"
                                style={tomorrow}
                                customStyle={{
                                  margin: 0,
                                  background: 'transparent',
                                  fontSize: '12px',
                                }}
                              >
                                {formatResult(task.result)}
                              </SyntaxHighlighter>
                            </Paper>
                          </Box>
                        ) : task.status === 'failed' && task.error ? (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom color="error">
                              Error:
                            </Typography>
                            <Alert severity="error">
                              {task.error}
                            </Alert>
                          </Box>
                        ) : (
                          <Typography color="text.secondary">
                            No additional information available
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {isSubmitting && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default TaskDelegation;
