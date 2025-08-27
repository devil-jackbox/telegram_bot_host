# Telegram Bot Hosting Platform

A comprehensive, web-based Telegram bot hosting platform that allows you to create, manage, and deploy multiple Telegram bots from your browser. Perfect for managing bots from any device, including Android tablets.

## 🚀 Features

### Core Features
- **Multi-language Bot Support**: Create bots in JavaScript, TypeScript, Python, PHP, Ruby, and Go
- **Web-based Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **Real-time Bot Management**: Start, stop, and restart bots with one click
- **Live Error Monitoring**: Real-time error tracking and logging
- **Individual Bot Logs**: Separate log viewing for each bot
- **Auto-start Capability**: Bots can automatically start when the platform launches
- **Mobile-friendly UI**: Responsive design that works on tablets and phones

### Advanced Features
- **Socket.IO Integration**: Real-time updates and communication
- **Process Management**: Robust bot process lifecycle management
- **File System Management**: Automatic file creation and dependency management
- **Security Features**: Rate limiting, CORS protection, and input validation
- **Railway Deployment Ready**: One-click deployment to Railway

## 🛠️ Supported Languages

| Language | File Extension | Status |
|----------|----------------|---------|
| JavaScript | `.js` | ✅ Full Support |
| TypeScript | `.ts` | ✅ Full Support |
| Python | `.py` | ✅ Full Support |
| PHP | `.php` | ✅ Full Support |
| Ruby | `.rb` | 🚧 Basic Support |
| Go | `.go` | 🚧 Basic Support |

## 📦 Installation

### Prerequisites
- Node.js 16+ 
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
   npm run install:all
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
   http://localhost:3001
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
   - Railway will automatically detect the configuration and deploy
   - The build process will install dependencies and build the React app

### Troubleshooting Railway Deployment

If you encounter build errors:

1. **Check the build logs** in Railway dashboard
2. **Ensure all files are committed** to your repository
3. **Verify environment variables** are set correctly
4. **Try the alternative deployment methods** below

### Alternative Deployment Methods

#### Docker Deployment
```bash
# Build the Docker image
docker build -t telegram-bot-platform .

# Run the container
docker run -p 3001:3001 telegram-bot-platform
```

#### Manual Deployment
```bash
# Install dependencies
npm run install:all

# Build the application
npm run build

# Start the server
npm start
```

## 🎯 Usage

### Creating Your First Bot

1. **Get a Bot Token**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot and get the token

2. **Create Bot in Platform**
   - Click "Create Bot" button
   - Enter bot name and token
   - Select programming language
   - Optionally add custom code
   - Enable auto-start if desired

3. **Edit Bot Code**
   - Click on your bot in the sidebar
   - Use the Monaco code editor to write your bot logic
   - Save changes

4. **Start Your Bot**
   - Click the "Start" button
   - Monitor logs and errors in real-time

### Bot Management

- **Dashboard**: Overview of all bots with status indicators
- **Code Editor**: Full-featured editor with syntax highlighting
- **Logs**: Real-time log viewing with filtering options
- **Errors**: Dedicated error monitoring and debugging
- **Settings**: Bot configuration and platform settings

## 🏗️ Architecture

### Backend (Node.js/Express)
- **BotManager**: Handles bot lifecycle and process management
- **Socket.IO**: Real-time communication and updates
- **File System**: Automatic file creation and management
- **API Routes**: RESTful endpoints for bot operations
- **Security**: Rate limiting, CORS, and input validation

### Frontend (React)
- **Context API**: State management for bots and socket connection
- **Monaco Editor**: Professional code editing experience
- **Tailwind CSS**: Modern, responsive UI design
- **Real-time Updates**: Live status and log updates

### Bot Execution
- **Process Isolation**: Each bot runs in its own process
- **Language Support**: Automatic dependency management
- **Error Handling**: Graceful error recovery and logging
- **Resource Management**: Memory and CPU monitoring

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
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
- Programming language
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
└── railway.json           # Railway deployment config
```

## 🚀 Deployment

### Railway (Recommended)

1. **Fork this repository**
2. **Connect to Railway**
3. **Set environment variables**
4. **Deploy automatically**

### Troubleshooting Build Issues

If you encounter "Failed to build an image" errors:

1. **Run the verification script:**
   ```bash
   node verify-build.js
   ```

2. **Check the troubleshooting guide:** `TROUBLESHOOTING.md`

3. **Common solutions:**
   - Ensure all files are committed to your repository
   - Set `NODE_ENV=production` in Railway environment variables
   - Try alternative deployment methods below

### Alternative Deployment Methods

#### Docker Deployment
```bash
docker build -t telegram-bot-platform .
docker run -p 3001:3001 telegram-bot-platform
```

#### Manual Deployment
```bash
npm run install:all
npm run build
npm start
```

### Other Platforms

The application can be deployed to any Node.js hosting platform:
- Heroku
- Vercel
- DigitalOcean
- AWS
- Google Cloud

## 🔒 Security

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **CORS Protection**: Configurable cross-origin requests
- **Process Isolation**: Bots run in separate processes
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
- **Community**: Join our Telegram group (link to be added)

## 🎉 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Tailwind CSS](https://tailwindcss.com/) for the UI framework
- [Socket.IO](https://socket.io/) for real-time communication
- [Railway](https://railway.app/) for deployment platform

---

**Made with ❤️ for the Telegram bot community**
