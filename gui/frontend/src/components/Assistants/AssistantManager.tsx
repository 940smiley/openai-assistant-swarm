import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SmartToy as AssistantIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useSwarm } from '../../contexts/SwarmContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AssistantFormData {
  name: string;
  description: string;
  instructions: string;
  model: string;
}

const DEFAULT_MODELS = [
  'gpt-4-1106-preview',
  'gpt-4',
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo',
];

const AssistantManager: React.FC = () => {
  const { state, createAssistant, updateAssistant, deleteAssistant } = useSwarm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<any>(null);
  const [formData, setFormData] = useState<AssistantFormData>({
    name: '',
    description: '',
    instructions: '',
    model: 'gpt-4-1106-preview',
  });

  const handleCreateNew = () => {
    setEditingAssistant(null);
    setFormData({
      name: '',
      description: '',
      instructions: '',
      model: 'gpt-4-1106-preview',
    });
    setDialogOpen(true);
  };

  const handleEdit = (assistant: any) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name || '',
      description: assistant.description || '',
      instructions: assistant.instructions || '',
      model: assistant.model || 'gpt-4-1106-preview',
    });
    setDialogOpen(true);
  };

  const handleDelete = (assistant: any) => {
    setAssistantToDelete(assistant);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Assistant name is required');
        return;
      }

      const assistantData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        model: formData.model,
      };

      if (editingAssistant) {
        await updateAssistant(editingAssistant.id, assistantData);
      } else {
        await createAssistant(assistantData);
      }

      setDialogOpen(false);
      setEditingAssistant(null);
    } catch (error) {
      // Error is handled in the context
    }
  };

  const handleConfirmDelete = async () => {
    if (assistantToDelete) {
      try {
        await deleteAssistant(assistantToDelete.id);
        setDeleteDialogOpen(false);
        setAssistantToDelete(null);
      } catch (error) {
        // Error is handled in the context
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssistantIcon color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('gpt-', 'GPT-') || 'Unknown'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {params.value || 'No description'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {format(new Date(params.value * 1000), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Edit Assistant">
              <EditIcon />
            </Tooltip>
          }
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete Assistant">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDelete(params.row)}
        />,
      ],
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
            Please configure your OpenAI API key in the Configuration section to manage assistants.
          </Typography>
          <Button variant="contained" href="/configuration" sx={{ mt: 2 }}>
            Configure API Key
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Assistant Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          disabled={state.isLoading}
        >
          Create Assistant
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Assistants
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {state.assistants.length}
                  </Typography>
                </Box>
                <AssistantIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    GPT-4 Models
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {state.assistants.filter(a => a.model?.includes('gpt-4')).length}
                  </Typography>
                </Box>
                <CodeIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    GPT-3.5 Models
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {state.assistants.filter(a => a.model?.includes('gpt-3.5')).length}
                  </Typography>
                </Box>
                <SettingsIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    With Tools
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {state.assistants.filter(a => a.tools && a.tools.length > 0).length}
                  </Typography>
                </Box>
                <LaunchIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assistants Table */}
      <Card className="card-elevated">
        <CardContent>
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={state.assistants}
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAssistant ? 'Edit Assistant' : 'Create New Assistant'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Assistant Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={formData.model}
                label="Model"
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              >
                {DEFAULT_MODELS.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model.replace('gpt-', 'GPT-')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Instructions"
              fullWidth
              variant="outlined"
              multiline
              rows={6}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Provide detailed instructions for this assistant's behavior and capabilities..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={state.isLoading || !formData.name.trim()}
          >
            {editingAssistant ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the assistant "{assistantToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={state.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssistantManager;
