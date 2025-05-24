# OpenAI Assistant Swarm Manager GUI

A professional, corporate-style web interface for managing OpenAI Assistant Swarms. This GUI provides a comprehensive dashboard for creating, managing, and monitoring AI assistants and their delegated tasks.

## Features

### 🎯 Dashboard Overview
- Real-time system status monitoring
- Task execution statistics with charts
- Assistant deployment metrics
- Quick action buttons for common operations

### 🤖 Assistant Management
- Create, edit, and delete OpenAI assistants
- Support for multiple GPT models (GPT-4, GPT-3.5)
- Comprehensive assistant configuration options
- Visual assistant model distribution analytics

### 📋 Task Delegation
- Intuitive task creation interface
- Select specific assistants or auto-delegate to available ones
- Real-time task execution tracking
- Detailed task history with results
- JSON result viewer with syntax highlighting

### 📊 Real-time Monitoring
- Live WebSocket connection status
- Activity log streaming
- System metrics visualization
- Performance analytics with charts
- Export logs functionality

### ⚙️ Configuration Management
- Secure OpenAI API key configuration
- Swarm manager settings
- Debug mode toggle
- System information display

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **State Management**: React Context + Reducers
- **Charts**: Recharts
- **Styling**: Emotion (CSS-in-JS)
- **Real-time**: WebSocket integration

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: ws library
- **API Client**: OpenAI SDK
- **Swarm Library**: @mintplex-labs/openai-assistant-swarm

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- OpenAI API key

### Quick Start

1. **Install Dependencies**
   ```bash
   # Backend
   cd gui/backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy and configure environment file
   cp ../../.env.example ../../.env
   # Edit .env and add your OPEN_AI_KEY
   ```

3. **Build and Start**
   ```bash
   # Build backend
   cd ../backend
   npm run build
   
   # Start backend (development)
   npm run dev
   
   # In another terminal, start frontend
   cd ../frontend
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Development

### Backend Development
```bash
cd gui/backend
npm run dev  # Start with hot reload
```

### Frontend Development
```bash
cd gui/frontend
npm start    # Start development server
```

### Building for Production
```bash
# Backend
cd gui/backend
npm run build

# Frontend
cd gui/frontend
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# OpenAI Configuration
OPEN_AI_KEY=sk-your-openai-api-key-here

# Server Configuration (optional)
PORT=3001
FRONTEND_URL=http://localhost:3000

# Development (optional)
NODE_ENV=development
```

### Swarm Manager Settings

Configure the swarm manager through the web interface:

- **Manager Name**: Custom name for the swarm manager assistant
- **Model**: Choose between GPT-4 or GPT-3.5 models
- **Instructions**: Custom instructions for the manager
- **Debug Mode**: Enable detailed logging

## API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration
- `POST /api/openai/configure` - Configure API key

### Assistants
- `GET /api/assistants` - List all assistants
- `POST /api/assistants` - Create new assistant
- `PUT /api/assistants/:id` - Update assistant
- `DELETE /api/assistants/:id` - Delete assistant

### Tasks
- `POST /api/tasks/delegate` - Delegate new task
- `GET /api/tasks/:taskId` - Get task status

### System
- `GET /health` - Health check

## WebSocket Events

The application uses WebSocket for real-time updates:

### Client Events
- `connected` - Client connected successfully
- `swarm-initialized` - Swarm manager ready
- `task-started` - Task delegation started
- `task-completed` - Task finished successfully
- `task-error` - Task failed
- `assistant-created/updated/deleted` - Assistant changes
- `config-updated` - Configuration changed

## Usage Guide

### 1. Initial Setup
1. Access the web interface at http://localhost:3000
2. Navigate to Configuration
3. Enter your OpenAI API key
4. Configure swarm manager settings

### 2. Creating Assistants
1. Go to Assistant Manager
2. Click "Create Assistant"
3. Fill in name, description, and instructions
4. Select appropriate GPT model
5. Save the assistant

### 3. Delegating Tasks
1. Navigate to Task Delegation
2. Enter task description
3. Select specific assistants or choose "Any Available"
4. Click "Delegate Task"
5. Monitor progress in real-time

### 4. Monitoring
1. Use the Dashboard for overview
2. Check Real-time Monitor for detailed logs
3. View task history and results
4. Export logs for analysis

## Customization

### Theming
The application uses Material-UI theming. Customize colors and typography in `src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    // ... customize as needed
  }
});
```

### Adding Features
1. Create new components in appropriate directories
2. Add routes in `src/App.tsx`
3. Update sidebar navigation in `src/components/Layout/Sidebar.tsx`
4. Extend API endpoints in backend as needed

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if backend is running on port 3001
   - Verify WebSocket connection in browser dev tools

2. **API Key Issues**
   - Ensure API key starts with "sk-"
   - Check API key has sufficient credits
   - Verify key permissions

3. **Task Delegation Fails**
   - Check if assistants are properly configured
   - Verify swarm manager is initialized
   - Review error logs in Real-time Monitor

### Debug Mode
Enable debug mode in Configuration to see detailed logs in:
- Browser console (frontend)
- Terminal output (backend)
- Real-time Monitor interface

## Security Considerations

- API keys are stored server-side only
- WebSocket connections are validated
- Input sanitization on all forms
- CORS properly configured
- No sensitive data in client-side code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the main project documentation
- Submit issues through GitHub
- Join the Discord community (link in main README)
