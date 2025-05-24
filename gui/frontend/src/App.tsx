import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import AssistantManager from './components/Assistants/AssistantManager';
import TaskDelegation from './components/Tasks/TaskDelegation';
import Configuration from './components/Configuration/Configuration';
import RealTimeMonitor from './components/Monitor/RealTimeMonitor';

// Context
import { WebSocketProvider } from './contexts/WebSocketContext';
import { SwarmProvider } from './contexts/SwarmContext';

// Create professional theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f5325c',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      color: '#212121',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      color: '#212121',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      color: '#212121',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#212121',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#212121',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#212121',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

const DRAWER_WIDTH = 280;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebSocketProvider>
        <SwarmProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar drawerWidth={DRAWER_WIDTH} />
              
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                  ml: { sm: `${DRAWER_WIDTH}px` },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Header />
                
                <Box
                  sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: 'background.default',
                    minHeight: 'calc(100vh - 64px)',
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/assistants" element={<AssistantManager />} />
                    <Route path="/tasks" element={<TaskDelegation />} />
                    <Route path="/monitor" element={<RealTimeMonitor />} />
                    <Route path="/configuration" element={<Configuration />} />
                  </Routes>
                </Box>
              </Box>
            </Box>
          </Router>
        </SwarmProvider>
      </WebSocketProvider>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'Roboto, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
