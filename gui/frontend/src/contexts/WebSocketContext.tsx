import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  clientId?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}`
      : 'ws://localhost:3001';
    
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      toast.success('Connected to swarm server');
    };

    newSocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Handle specific message types
        switch (message.type) {
          case 'connected':
            console.log('Client connected with ID:', message.clientId);
            break;
          case 'swarm-initialized':
            toast.success('Swarm initialized successfully');
            break;
          case 'swarm-error':
            toast.error(`Swarm error: ${message.data?.error}`);
            break;
          case 'task-started':
            toast.loading(`Task started: ${message.data?.taskId}`);
            break;
          case 'task-completed':
            toast.success(`Task completed: ${message.data?.taskId}`);
            break;
          case 'task-error':
            toast.error(`Task failed: ${message.data?.error}`);
            break;
          case 'assistant-created':
            toast.success('Assistant created successfully');
            break;
          case 'assistant-updated':
            toast.success('Assistant updated successfully');
            break;
          case 'assistant-deleted':
            toast.success('Assistant deleted successfully');
            break;
          case 'config-updated':
            toast.success('Configuration updated');
            break;
          default:
            console.log('Received message:', message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        setConnectionStatus('error');
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      toast.error('WebSocket connection error');
    };

    setSocket(newSocket);
  }, [socket, reconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, [socket]);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
