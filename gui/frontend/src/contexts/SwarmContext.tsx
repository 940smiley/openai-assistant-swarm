import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';
import { swarmAPI } from '../services/api';
import toast from 'react-hot-toast';

// Types
interface Assistant {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model: string;
  tools?: any[];
  file_ids?: string[];
  metadata?: Record<string, any>;
  created_at: number;
}

interface SwarmConfig {
  debug: boolean;
  managerAssistantOptions: {
    name: string;
    model: string;
    instructions?: string;
  };
}

interface Task {
  id: string;
  prompt: string;
  assistantIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  result?: any;
  error?: string;
}

interface SwarmState {
  assistants: Assistant[];
  config: SwarmConfig;
  tasks: Task[];
  isLoading: boolean;
  isInitialized: boolean;
  apiKeyConfigured: boolean;
  error: string | null;
}

type SwarmAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ASSISTANTS'; payload: Assistant[] }
  | { type: 'ADD_ASSISTANT'; payload: Assistant }
  | { type: 'UPDATE_ASSISTANT'; payload: Assistant }
  | { type: 'REMOVE_ASSISTANT'; payload: string }
  | { type: 'SET_CONFIG'; payload: SwarmConfig }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_API_KEY_CONFIGURED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SwarmState = {
  assistants: [],
  config: {
    debug: true,
    managerAssistantOptions: {
      name: '[AUTOMATED] Swarm Manager',
      model: 'gpt-4-1106-preview',
    },
  },
  tasks: [],
  isLoading: false,
  isInitialized: false,
  apiKeyConfigured: false,
  error: null,
};

function swarmReducer(state: SwarmState, action: SwarmAction): SwarmState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ASSISTANTS':
      return { ...state, assistants: action.payload };
    case 'ADD_ASSISTANT':
      return { ...state, assistants: [...state.assistants, action.payload] };
    case 'UPDATE_ASSISTANT':
      return {
        ...state,
        assistants: state.assistants.map(assistant =>
          assistant.id === action.payload.id ? action.payload : assistant
        ),
      };
    case 'REMOVE_ASSISTANT':
      return {
        ...state,
        assistants: state.assistants.filter(assistant => assistant.id !== action.payload),
      };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_API_KEY_CONFIGURED':
      return { ...state, apiKeyConfigured: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface SwarmContextType {
  state: SwarmState;
  
  // Assistant actions
  loadAssistants: () => Promise<void>;
  createAssistant: (assistantData: Partial<Assistant>) => Promise<void>;
  updateAssistant: (id: string, assistantData: Partial<Assistant>) => Promise<void>;
  deleteAssistant: (id: string) => Promise<void>;
  
  // Configuration actions
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<SwarmConfig>) => Promise<void>;
  configureApiKey: (apiKey: string) => Promise<void>;
  
  // Task actions
  delegateTask: (prompt: string, assistantIds?: string[]) => Promise<void>;
  
  // Utility actions
  refresh: () => Promise<void>;
}

const SwarmContext = createContext<SwarmContextType | undefined>(undefined);

export const useSwarm = () => {
  const context = useContext(SwarmContext);
  if (!context) {
    throw new Error('useSwarm must be used within a SwarmProvider');
  }
  return context;
};

interface SwarmProviderProps {
  children: React.ReactNode;
}

export const SwarmProvider: React.FC<SwarmProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(swarmReducer, initialState);
  const { lastMessage } = useWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'swarm-initialized':
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        break;
      case 'assistant-created':
        if (lastMessage.data) {
          dispatch({ type: 'ADD_ASSISTANT', payload: lastMessage.data });
        }
        break;
      case 'assistant-updated':
        if (lastMessage.data) {
          dispatch({ type: 'UPDATE_ASSISTANT', payload: lastMessage.data });
        }
        break;
      case 'assistant-deleted':
        if (lastMessage.data?.id) {
          dispatch({ type: 'REMOVE_ASSISTANT', payload: lastMessage.data.id });
        }
        break;
      case 'config-updated':
        if (lastMessage.data) {
          dispatch({ type: 'SET_CONFIG', payload: lastMessage.data });
        }
        break;
      case 'task-started':
        if (lastMessage.data) {
          const task: Task = {
            id: lastMessage.data.taskId,
            prompt: lastMessage.data.prompt,
            assistantIds: lastMessage.data.assistantIds,
            status: 'running',
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_TASK', payload: task });
        }
        break;
      case 'task-completed':
        if (lastMessage.data) {
          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              id: lastMessage.data.taskId,
              updates: { status: 'completed', result: lastMessage.data.response },
            },
          });
        }
        break;
      case 'task-error':
        if (lastMessage.data) {
          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              id: lastMessage.data.taskId,
              updates: { status: 'failed', error: lastMessage.data.error },
            },
          });
        }
        break;
    }
  }, [lastMessage]);

  // Assistant actions
  const loadAssistants = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const assistants = await swarmAPI.getAssistants();
      dispatch({ type: 'SET_ASSISTANTS', payload: assistants });
      dispatch({ type: 'SET_API_KEY_CONFIGURED', payload: true });
    } catch (error: any) {
      console.error('Failed to load assistants:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      if (error.message.includes('API key')) {
        dispatch({ type: 'SET_API_KEY_CONFIGURED', payload: false });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createAssistant = async (assistantData: Partial<Assistant>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newAssistant = await swarmAPI.createAssistant(assistantData);
      // Assistant will be added via WebSocket message
    } catch (error: any) {
      console.error('Failed to create assistant:', error);
      toast.error(`Failed to create assistant: ${error.message}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateAssistant = async (id: string, assistantData: Partial<Assistant>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedAssistant = await swarmAPI.updateAssistant(id, assistantData);
      // Assistant will be updated via WebSocket message
    } catch (error: any) {
      console.error('Failed to update assistant:', error);
      toast.error(`Failed to update assistant: ${error.message}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteAssistant = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await swarmAPI.deleteAssistant(id);
      // Assistant will be removed via WebSocket message
    } catch (error: any) {
      console.error('Failed to delete assistant:', error);
      toast.error(`Failed to delete assistant: ${error.message}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Configuration actions
  const loadConfig = async () => {
    try {
      const config = await swarmAPI.getConfig();
      dispatch({ type: 'SET_CONFIG', payload: config });
    } catch (error: any) {
      console.error('Failed to load config:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateConfig = async (configUpdates: Partial<SwarmConfig>) => {
    try {
      const updatedConfig = await swarmAPI.updateConfig(configUpdates);
      // Config will be updated via WebSocket message
    } catch (error: any) {
      console.error('Failed to update config:', error);
      toast.error(`Failed to update configuration: ${error.message}`);
    }
  };

  const configureApiKey = async (apiKey: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await swarmAPI.configureApiKey(apiKey);
      dispatch({ type: 'SET_API_KEY_CONFIGURED', payload: true });
      toast.success('API key configured successfully');
      // Reload assistants after configuring API key
      await loadAssistants();
    } catch (error: any) {
      console.error('Failed to configure API key:', error);
      toast.error(`Failed to configure API key: ${error.message}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Task actions
  const delegateTask = async (prompt: string, assistantIds: string[] = ['<any>']) => {
    try {
      const response = await swarmAPI.delegateTask(prompt, assistantIds);
      // Task will be added via WebSocket message
    } catch (error: any) {
      console.error('Failed to delegate task:', error);
      toast.error(`Failed to delegate task: ${error.message}`);
    }
  };

  // Utility actions
  const refresh = async () => {
    await Promise.all([
      loadConfig(),
      loadAssistants(),
    ]);
  };

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  const value: SwarmContextType = {
    state,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    loadConfig,
    updateConfig,
    configureApiKey,
    delegateTask,
    refresh,
  };

  return (
    <SwarmContext.Provider value={value}>
      {children}
    </SwarmContext.Provider>
  );
};
