import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  SmartToy as AssistantIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSwarm } from '../../contexts/SwarmContext';
import toast from 'react-hot-toast';

const Configuration: React.FC = () => {
  const { state, updateConfig, configureApiKey } = useSwarm();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState(state.config);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast.error('OpenAI API keys should start with "sk-"');
      return;
    }

    try {
      setIsSaving(true);
      await configureApiKey(apiKey);
      setApiKey('');
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      await updateConfig(config);
      toast.success('Configuration saved successfully');
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManagerOptionsChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      managerAssistantOptions: {
        ...prev.managerAssistantOptions,
        [field]: value,
      },
    }));
  };

  const availableModels = [
    'gpt-4-1106-preview',
    'gpt-4',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo',
  ];

  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* OpenAI API Configuration */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  OpenAI API Configuration
                </Typography>
              </Box>

              {state.apiKeyConfigured ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    OpenAI API key is configured and working correctly.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    OpenAI API key is required to use the assistant swarm functionality.
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                type={showApiKey ? 'text' : 'password'}
                label="OpenAI API Key"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || isSaving}
                fullWidth
              >
                {isSaving ? 'Configuring...' : 'Configure API Key'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Your API key is stored securely and only used to communicate with OpenAI services.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Swarm Manager Configuration */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssistantIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Swarm Manager Settings
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Manager Assistant Name"
                value={config.managerAssistantOptions.name}
                onChange={(e) => handleManagerOptionsChange('name', e.target.value)}
                sx={{ mb: 2 }}
                helperText="Name for the primary swarm manager assistant"
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Manager Model</InputLabel>
                <Select
                  value={config.managerAssistantOptions.model}
                  label="Manager Model"
                  onChange={(e) => handleManagerOptionsChange('model', e.target.value)}
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{model.replace('gpt-', 'GPT-')}</span>
                        {model.includes('gpt-4') && (
                          <Chip label="Recommended" size="small" color="success" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Manager Instructions"
                value={config.managerAssistantOptions.instructions || ''}
                onChange={(e) => handleManagerOptionsChange('instructions', e.target.value)}
                placeholder="Custom instructions for the swarm manager (optional)"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.debug}
                    onChange={(e) => handleConfigChange('debug', e.target.checked)}
                  />
                }
                label="Enable Debug Mode"
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Debug mode provides detailed console logs for troubleshooting
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  System Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Swarm Status:
                  </Typography>
                  <Chip
                    label={state.isInitialized ? 'Initialized' : 'Not Initialized'}
                    color={state.isInitialized ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    API Key Status:
                  </Typography>
                  <Chip
                    label={state.apiKeyConfigured ? 'Configured' : 'Not Configured'}
                    color={state.apiKeyConfigured ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Assistants:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {state.assistants.length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Tasks:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {state.tasks.filter(task => task.status === 'running').length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tasks:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {state.tasks.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Environment Variables */}
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RefreshIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Environment Information
                </Typography>
              </Box>

              <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  Frontend URL: {window.location.origin}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  Backend URL: {process.env.NODE_ENV === 'production' ? 'Same Origin' : 'http://localhost:3001'}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  Environment: {process.env.NODE_ENV}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  React Version: {React.version}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Configuration */}
        <Grid item xs={12}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Save Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Save your swarm manager configuration changes
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Configuration;
