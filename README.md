# Telegram Bot Hosting Platform

A modern, web-based Telegram bot hosting platform designed for developers who want full control over their bot code. Deploy and manage JavaScript Telegram bots with real-time monitoring, debugging, and environment variable management.

## 🚀 Features

### Core Features
- **JavaScript Bot Support**: Create and deploy JavaScript Telegram bots
- **Web-based Code Editor**: Monaco Editor with syntax highlighting and fullscreen mode
- **Real-time Bot Management**: Start, stop, and restart bots with one click
- **Live Error Monitoring**: Real-time error tracking with copy-to-clipboard functionality
- **Environment Variables**: Secure management of bot configuration and secrets
- **Individual Bot Logs**: Separate log viewing for each bot
- **Auto-start Capability**: Bots can automatically start when the platform launches
- **Mobile-friendly UI**: Responsive design that works on tablets and phones

### Advanced Features
- **Socket.IO Integration**: Real-time updates and communication
- **Process Management**: Robust bot process lifecycle management with orphaned process cleanup
- **Message Deduplication**: Prevents flooding when bots restart
- **Rate Limiting**: Built-in protection against API abuse
- **Railway Deployment Ready**: One-click deployment to Railway
- **Graceful Shutdown**: Proper cleanup of all bot processes

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: React, Monaco Editor, Tailwind CSS
- **Bot Runtime**: JavaScript with node-telegram-bot-api
- **Deployment**: Railway, Docker support
- **Process Management**: Child process isolation with PID tracking

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-bot-hosting-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Railway Deployment

1. **Connect your repository to Railway**
   - Go to [Railway.app](https://railway.app)
   - Create a new project
   - Connect your GitHub repository

2. **Set environment variables**
   - Add the variables from `.env.example` to your Railway project
   - Set `NODE_ENV=production`

3. **Deploy**
   - Railway will automatically detect the Docker configuration and deploy
   - The build process will install dependencies and build the React app

## 🎯 Usage

### Creating Your First Bot

1. **Get a Bot Token**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot and get the token

2. **Create Bot in Platform**
   - Click "Create Bot" button
   - Enter bot name and token
   - Add custom JavaScript code or use the template
   - Enable auto-start if desired

3. **Configure Environment Variables**
   - Go to the Environment Variables tab
   - Add your bot token and other configuration
   - Set variables as public or secret

4. **Start Your Bot**
   - Click the "Start" button
   - Monitor logs and errors in real-time

### Bot Management

- **Dashboard**: Overview of all bots with status indicators
- **Code Editor**: Full-featured editor with syntax highlighting and fullscreen mode
- **Environment Variables**: Secure management of bot configuration
- **Errors Tab**: Real-time error monitoring with copy functionality
- **Logs**: Real-time log viewing with filtering options
- **Settings**: Platform configuration and bot settings

## 🏗️ Architecture

### Backend (Node.js/Express)
- **BotManager**: Handles bot lifecycle and process management
- **Socket.IO**: Real-time communication and updates
- **Process Isolation**: Each bot runs in its own process with PID tracking
- **API Routes**: RESTful endpoints for bot operations
- **Security**: Rate limiting, CORS, and input validation

### Frontend (React)
- **Context API**: State management for bots and socket connection
- **Monaco Editor**: Professional code editing experience with fullscreen support
- **Tailwind CSS**: Modern, responsive UI design
- **Real-time Updates**: Live status, log, and error updates

### Bot Execution
- **Process Isolation**: Each bot runs in its own detached process
- **Message Deduplication**: Prevents duplicate responses on restart
- **Rate Limiting**: Built-in delays to prevent API flooding
- **Error Handling**: Graceful error recovery and logging
- **Resource Management**: Memory and CPU monitoring

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `MAX_BOTS_PER_USER` | Maximum bots per user | `10` |
| `MAX_LOGS_PER_BOT` | Maximum logs per bot | `1000` |
| `MAX_ERRORS_PER_BOT` | Maximum errors per bot | `100` |

### Bot Configuration

Each bot has its own configuration file (`config.json`) containing:
- Bot ID and name
- Telegram token
- Environment variables
- Auto-start preference
- Creation and update timestamps

## 📁 Project Structure

```
telegram-bot-hosting-platform/
├── server.js                 # Main server entry point
├── package.json             # Backend dependencies
├── src/
│   ├── botManager.js        # Bot lifecycle management
│   ├── routes/              # API routes
│   │   ├── bots.js         # Bot CRUD operations
│   │   ├── files.js        # File management
│   │   └── logs.js         # Log management
│   └── utils/
│       └── logger.js       # Winston logger configuration
├── client/                  # React frontend
│   ├── package.json        # Frontend dependencies
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── index.js        # Frontend entry point
│   └── public/             # Static assets
├── bots/                   # Bot files directory
├── logs/                   # Application logs
├── Dockerfile             # Docker configuration
└── railway.json           # Railway deployment config
```

## 🚀 Deployment

### Railway (Recommended)

1. **Fork this repository**
2. **Connect to Railway**
3. **Set environment variables**
4. **Deploy automatically**

The platform is optimized for Railway's free tier with:
- Efficient resource usage
- Automatic process cleanup
- Graceful shutdown handling
- Optimized for cold starts

### Docker Deployment
```bash
docker build -t telegram-bot-platform .
docker run -p 3000:3000 telegram-bot-platform
```

## 🔒 Security

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **CORS Protection**: Configurable cross-origin requests
- **Process Isolation**: Bots run in separate processes
- **Environment Variables**: Secure secret management
- **Error Handling**: Graceful error recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check this README and inline code comments

## 🎉 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Tailwind CSS](https://tailwindcss.com/) for the UI framework
- [Socket.IO](https://socket.io/) for real-time communication
- [Railway](https://railway.app/) for deployment platform
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) for Telegram bot functionality

---

**Made with ❤️ for the Telegram bot developer community**
