import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export interface Assistant {
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

export interface SwarmConfig {
  debug: boolean;
  managerAssistantOptions: {
    name: string;
    model: string;
    instructions?: string;
  };
}

export interface TaskRequest {
  prompt: string;
  assistantIds?: string[];
}

export interface TaskResponse {
  success: boolean;
  taskId: string;
  message: string;
}

export const swarmAPI = {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },

  // Configuration
  async getConfig(): Promise<SwarmConfig> {
    const response = await api.get('/config');
    return response.data;
  },

  async updateConfig(config: Partial<SwarmConfig>): Promise<SwarmConfig> {
    const response = await api.put('/config', config);
    return response.data.config;
  },

  async configureApiKey(apiKey: string): Promise<void> {
    const response = await api.post('/openai/configure', { apiKey });
    return response.data;
  },

  // Assistants
  async getAssistants(): Promise<Assistant[]> {
    const response = await api.get('/assistants');
    return response.data;
  },

  async createAssistant(assistantData: Partial<Assistant>): Promise<Assistant> {
    const response = await api.post('/assistants', assistantData);
    return response.data;
  },

  async updateAssistant(id: string, assistantData: Partial<Assistant>): Promise<Assistant> {
    const response = await api.put(`/assistants/${id}`, assistantData);
    return response.data;
  },

  async deleteAssistant(id: string): Promise<void> {
    const response = await api.delete(`/assistants/${id}`);
    return response.data;
  },

  // Tasks
  async delegateTask(prompt: string, assistantIds?: string[]): Promise<TaskResponse> {
    const response = await api.post('/tasks/delegate', {
      prompt,
      assistantIds: assistantIds || ['<any>'],
    });
    return response.data;
  },

  async getTaskStatus(taskId: string): Promise<any> {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },
};

// Utility functions
export const formatError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export const isApiError = (error: any): boolean => {
  return error.response && error.response.status >= 400;
};

export default api;
