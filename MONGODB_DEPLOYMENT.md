# MongoDB Deployment Guide for Railway

This guide explains how to deploy your Telegram Bot Platform with MongoDB persistence on Railway.

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
2. **Railway Account** (Free tier available)
3. **GitHub Repository** with your code

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose the free M0 tier)
4. Create a database user:
   - Go to Database Access → Add New User
   - Username: `botplatform`
   - Password: Generate a secure password
   - Database User Privileges: Read and write to any database
5. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` to allow access from anywhere (for Railway)
6. Get your connection string:
   - Go to Database → Connect → Connect your application
   - Copy the connection string (replace `<password>` with your actual password)

## Step 2: Deploy to Railway

1. **Connect GitHub Repository:**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Set Environment Variables:**
   - Go to your project → Variables tab
   - Add these variables:
   ```
   MONGODB_URI=mongodb+srv://botplatform:<password>@cluster0.xxxxx.mongodb.net/telegram-bot-platform?retryWrites=true&w=majority
   ENCRYPTION_KEY=your_32_character_random_string_here
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   ```

3. **Generate Encryption Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy:**
   - Railway will automatically build and deploy your application
   - The build process will install dependencies and build the client

## Step 3: Verify Deployment

1. **Check Logs:**
   - Go to your Railway project → Deployments → View logs
   - Look for "MongoDB connected successfully"

2. **Test the Application:**
   - Visit your Railway URL
   - Create a test bot
   - Verify it persists after redeployment

## Step 4: Configure Custom Domain (Optional)

1. Go to your Railway project → Settings → Domains
2. Add your custom domain
3. Update your MongoDB connection string if needed

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `ENCRYPTION_KEY` | 32-character key for encrypting bot tokens | `a1b2c3d4e5f6...` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `0.0.0.0` |

## Data Persistence

With MongoDB, your data will persist across:
- ✅ Railway redeployments
- ✅ Code changes
- ✅ Server restarts
- ✅ Platform updates

## Security Features

- **Token Encryption:** Bot tokens are encrypted before storing in MongoDB
- **Environment Variables:** Sensitive data is stored securely
- **Connection Security:** MongoDB Atlas uses encrypted connections

## Monitoring

- **MongoDB Atlas:** Monitor database usage and performance
- **Railway Logs:** View application logs and errors
- **Bot Logs:** Check individual bot logs in the web interface

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed:**
   - Check your `MONGODB_URI` format
   - Verify your MongoDB user has correct permissions
   - Ensure IP whitelist includes Railway's IPs

2. **Encryption Key Issues:**
   - Ensure `ENCRYPTION_KEY` is exactly 32 characters
   - Don't change the key after deployment (existing data will be unreadable)

3. **Build Failures:**
   - Check Railway build logs
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

### Getting Help:

- Check Railway deployment logs
- Review MongoDB Atlas connection logs
- Test locally with the same environment variables

## Cost Estimation

- **Railway Free Tier:** $0/month (with usage limits)
- **MongoDB Atlas M0:** $0/month (512MB storage)
- **Total:** $0/month for small-scale usage

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Scale up as your bot usage grows
4. Consider upgrading to paid tiers for production use

---

Your Telegram Bot Platform is now deployed with persistent MongoDB storage! 🚀