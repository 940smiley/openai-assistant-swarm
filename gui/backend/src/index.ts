import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { EnableSwarmAbilities, OpenAIExtended } from '@mintplex-labs/openai-assistant-swarm';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Types
interface SwarmConfig {
  debug: boolean;
  managerAssistantOptions: {
    name: string;
    model: string;
    instructions?: string;
  };
}

interface TaskRequest {
  prompt: string;
  assistantIds?: string[];
}

interface WebSocketClient {
  id: string;
  ws: any;
  isAlive: boolean;
}

class SwarmGUIServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private openaiClient: OpenAIExtended | null = null;
  private swarmConfig: SwarmConfig = {
    debug: true,
    managerAssistantOptions: {
      name: '[AUTOMATED] Swarm Manager',
      model: 'gpt-4-1106-preview'
    }
  };

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeSwarm();
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Swarm configuration
    this.app.get('/api/config', (req, res) => {
      res.json(this.swarmConfig);
    });

    this.app.put('/api/config', async (req, res) => {
      try {
        this.swarmConfig = { ...this.swarmConfig, ...req.body };
        await this.initializeSwarm();
        res.json({ success: true, config: this.swarmConfig });
        this.broadcast('config-updated', this.swarmConfig);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // OpenAI API key configuration
    this.app.post('/api/openai/configure', async (req, res) => {
      try {
        const { apiKey } = req.body;
        if (!apiKey) {
          return res.status(400).json({ error: 'API key is required' });
        }
        
        process.env.OPEN_AI_KEY = apiKey;
        await this.initializeSwarm();
        res.json({ success: true, message: 'OpenAI API key configured successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all assistants
    this.app.get('/api/assistants', async (req, res) => {
      try {
        if (!this.openaiClient) {
          return res.status(400).json({ error: 'OpenAI client not initialized' });
        }
        
        const assistants = await this.openaiClient.beta.assistants.swarm.allAssistants();
        res.json(assistants);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create new assistant
    this.app.post('/api/assistants', async (req, res) => {
      try {
        if (!this.openaiClient) {
          return res.status(400).json({ error: 'OpenAI client not initialized' });
        }

        const assistant = await this.openaiClient.beta.assistants.create(req.body);
        res.json(assistant);
        this.broadcast('assistant-created', assistant);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update assistant
    this.app.put('/api/assistants/:id', async (req, res) => {
      try {
        if (!this.openaiClient) {
          return res.status(400).json({ error: 'OpenAI client not initialized' });
        }

        const { id } = req.params;
        const assistant = await this.openaiClient.beta.assistants.update(id, req.body);
        res.json(assistant);
        this.broadcast('assistant-updated', assistant);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete assistant
    this.app.delete('/api/assistants/:id', async (req, res) => {
      try {
        if (!this.openaiClient) {
          return res.status(400).json({ error: 'OpenAI client not initialized' });
        }

        const { id } = req.params;
        await this.openaiClient.beta.assistants.del(id);
        res.json({ success: true, id });
        this.broadcast('assistant-deleted', { id });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delegate task
    this.app.post('/api/tasks/delegate', async (req, res) => {
      try {
        if (!this.openaiClient) {
          return res.status(400).json({ error: 'OpenAI client not initialized' });
        }

        const { prompt, assistantIds = ['<any>'] }: TaskRequest = req.body;
        const taskId = uuidv4();

        // Start task delegation in background
        this.delegateTask(taskId, prompt, assistantIds);
        
        res.json({ success: true, taskId, message: 'Task delegation started' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get task status (placeholder for future implementation)
    this.app.get('/api/tasks/:taskId', (req, res) => {
      const { taskId } = req.params;
      // This would query a database or cache for task status
      res.json({ taskId, status: 'running', message: 'Task status tracking not yet implemented' });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        isAlive: true
      };

      this.clients.set(clientId, client);
      
      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      }));
    });

    // Ping clients periodically
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }
        
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);
  }

  private handleWebSocketMessage(clientId: string, message: any) {
    // Handle incoming WebSocket messages from clients
    console.log(`Message from ${clientId}:`, message);
  }

  private broadcast(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) { // OPEN
        client.ws.send(message);
      }
    });
  }

  private async initializeSwarm() {
    try {
      if (!process.env.OPEN_AI_KEY) {
        console.log('OpenAI API key not configured');
        return;
      }

      const openaiClient = new OpenAI({
        apiKey: process.env.OPEN_AI_KEY
      });

      this.openaiClient = EnableSwarmAbilities(openaiClient, this.swarmConfig);
      
      // Set up event listeners
      this.openaiClient.beta.assistants.swarm.emitter.on('parent_assistant_complete', ({ data }) => {
        this.broadcast('parent-assistant-complete', data);
      });

      this.openaiClient.beta.assistants.swarm.emitter.on('child_assistants_complete', ({ data }) => {
        this.broadcast('child-assistants-complete', data);
      });

      this.openaiClient.beta.assistants.swarm.emitter.on('poll_event', ({ data }) => {
        this.broadcast('poll-event', data);
      });

      await this.openaiClient.beta.assistants.swarm.init();
      console.log('Swarm initialized successfully');
      this.broadcast('swarm-initialized', { success: true });
    } catch (error) {
      console.error('Failed to initialize swarm:', error);
      this.broadcast('swarm-error', { error: error.message });
    }
  }

  private async delegateTask(taskId: string, prompt: string, assistantIds: string[]) {
    try {
      if (!this.openaiClient) {
        throw new Error('OpenAI client not initialized');
      }

      this.broadcast('task-started', { taskId, prompt, assistantIds });

      const response = await this.openaiClient.beta.assistants.swarm.delegateWithPrompt(
        prompt,
        assistantIds
      );

      this.broadcast('task-completed', {
        taskId,
        response: {
          parentRun: response.concludedPrimaryRun,
          subRuns: response.subRuns
        }
      });
    } catch (error) {
      this.broadcast('task-error', {
        taskId,
        error: error.message
      });
    }
  }

  public start(port: number = 3001) {
    this.server.listen(port, () => {
      console.log(`🚀 OpenAI Assistant Swarm GUI Backend running on port ${port}`);
      console.log(`📊 WebSocket server ready for real-time updates`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  }
}

// Start the server
const server = new SwarmGUIServer();
server.start(parseInt(process.env.PORT || '3001'));

export default SwarmGUIServer;
