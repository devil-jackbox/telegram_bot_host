# Deployment Guide

## Railway Deployment

### Prerequisites
- GitHub repository with the code
- Railway account

### Step-by-Step Deployment

1. **Prepare Your Repository**
   ```bash
   # Ensure all files are committed
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   ```
   NODE_ENV=production
   PORT=3001
   LOG_LEVEL=info
   CORS_ORIGIN=*
   MAX_BOTS_PER_USER=10
   MAX_LOGS_PER_BOT=1000
   MAX_ERRORS_PER_BOT=100
   LOG_RETENTION_DAYS=30
   AUTO_RESTART_ON_ERROR=true
   ```

4. **Deploy**
   - Railway will automatically detect the configuration
   - The build process will:
     - Install Node.js 18
     - Install backend dependencies
     - Install frontend dependencies
     - Build the React app
     - Start the server

### Troubleshooting

#### Build Fails
1. **Check build logs** in Railway dashboard
2. **Verify all files** are in the repository:
   - `package.json`
   - `client/package.json`
   - `.nixpacks.toml`
   - `railway.json`
   - `railway.toml`

3. **Common issues**:
   - Missing dependencies in package.json
   - Incorrect file paths
   - Environment variables not set

#### Runtime Errors
1. **Check application logs** in Railway dashboard
2. **Verify environment variables** are set correctly
3. **Check the health endpoint**: `https://your-app.railway.app/health`

#### Alternative Solutions

If Railway deployment continues to fail:

1. **Use Docker**:
   ```bash
   docker build -t telegram-bot-platform .
   docker run -p 3001:3001 telegram-bot-platform
   ```

2. **Deploy to other platforms**:
   - Heroku
   - Vercel
   - DigitalOcean App Platform
   - Render

3. **Local deployment**:
   ```bash
   npm run install:all
   npm run build
   npm start
   ```

### Verification

After successful deployment:

1. **Check health endpoint**: `https://your-app.railway.app/health`
2. **Access the application**: `https://your-app.railway.app`
3. **Test bot creation**: Create a test bot with a valid token
4. **Monitor logs**: Check Railway logs for any errors

### Support

If you continue to have issues:
1. Check the build logs in Railway dashboard
2. Verify all configuration files are present
3. Try the alternative deployment methods
4. Create an issue in the GitHub repository