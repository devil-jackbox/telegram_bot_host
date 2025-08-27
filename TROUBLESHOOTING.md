# Build Troubleshooting Guide

## Common Build Issues and Solutions

### 1. "Failed to build an image" Error

This error typically occurs during Railway deployment. Here are the most common causes and solutions:

#### **Issue: npm warn config production Use --omit-dev instead**
**Symptoms:** Build fails with npm warnings about production config
**Solution:**
- Updated build configurations to use `--omit=dev` instead of `--only=production`
- This is a newer npm syntax that avoids the warnings

#### **Issue: Missing build:client script**
**Symptoms:** Build fails looking for `npm run build:client`
**Solution:**
- Added `build:client` script to package.json
- Updated Railway configuration to use explicit build commands

#### **Issue: Docker React Build Failure**
**Symptoms:** `RUN cd client && npm run build` fails with exit code 1
**Solutions:**
1. **Use the updated Dockerfile** with better error handling
2. **Try Dockerfile.simple** for a minimal build process
3. **Check for missing dependencies** in client/package.json
4. **Set environment variables** for the build process:
   ```dockerfile
   ENV NODE_ENV=production
   ENV GENERATE_SOURCEMAP=false
   ENV CI=false
   ```

#### **Issue: ESLint Errors in React Build**
**Symptoms:** Build fails with ESLint errors like `Unexpected use of 'confirm' no-restricted-globals`
**Solutions:**
1. **Fix the code**: Replace `confirm()` with `window.confirm()`
2. **Use no-lint build**: `npm run build:no-lint`
3. **Add ESLint configuration**: Create `.eslintrc.js` with custom rules
4. **Set environment variable**: `DISABLE_ESLINT_PLUGIN=true`

#### **Issue: Missing Dependencies**
**Symptoms:** Build fails during npm install
**Solution:**
```bash
# Check if all dependencies are properly listed
npm ls --depth=0
cd client && npm ls --depth=0
```

#### **Issue: Node.js Version Mismatch**
**Symptoms:** Build fails with version-related errors
**Solution:**
- Ensure `.nixpacks.toml` specifies `nodejs_18`
- Check `package.json` engines field includes `"node": ">=16.0.0"`

#### **Issue: Build Script Errors**
**Symptoms:** Build fails during React build process
**Solution:**
```bash
# Test build locally first
npm run install:all
npm run build
```

### 2. Railway-Specific Issues

#### **Issue: Nixpacks Build Failure**
**Symptoms:** Railway can't detect or use the build configuration
**Solutions:**
1. **Use railway.toml instead of .nixpacks.toml:**
   ```toml
   [build]
   builder = "nixpacks"
   
   [deploy]
   startCommand = "npm start"
   healthcheckPath = "/health"
   ```

2. **Alternative: Use Dockerfile:**
   ```bash
   # Railway will automatically detect Dockerfile
   docker build -t telegram-bot-platform .
   ```

#### **Issue: Environment Variables**
**Symptoms:** App builds but fails to start
**Solution:**
Set these environment variables in Railway:
```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=*
```

### 3. React Build Issues

#### **Issue: Source Map Generation**
**Symptoms:** Build takes too long or fails
**Solution:**
The build script already includes `GENERATE_SOURCEMAP=false` to speed up builds.

#### **Issue: Memory Issues**
**Symptoms:** Build fails with memory errors
**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 4. Dependency Issues

#### **Issue: Peer Dependencies**
**Symptoms:** Warnings about peer dependencies
**Solution:**
```bash
# Install with legacy peer deps
npm install --legacy-peer-deps
cd client && npm install --legacy-peer-deps
```

#### **Issue: Version Conflicts**
**Symptoms:** Package version conflicts
**Solution:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 5. File Structure Issues

#### **Issue: Missing Files**
**Symptoms:** Build can't find required files
**Solution:**
Run the verification script:
```bash
node verify-build.js
```

#### **Issue: Incorrect Paths**
**Symptoms:** Import errors or file not found
**Solution:**
Check these critical paths:
- `src/botManager.js`
- `client/src/App.js`
- `client/src/index.js`
- `client/src/index.css`

### 6. Platform-Specific Issues

#### **Railway Issues:**
1. **Check build logs** in Railway dashboard
2. **Verify environment variables** are set
3. **Try different build configurations:**
   - Use `railway.toml`
   - Use `Dockerfile`
   - Use `.nixpacks.toml`

#### **Heroku Issues:**
1. **Add buildpack:**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```
2. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

#### **Vercel Issues:**
1. **Create vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

### 7. Debugging Steps

#### **Step 1: Local Testing**
```bash
# Test the complete build process locally
npm run install:all
npm run build
npm start
```

#### **Step 2: Check Logs**
```bash
# Check for any error messages
npm run build 2>&1 | tee build.log
```

#### **Step 3: Verify Configuration**
```bash
# Run the verification script
node verify-build.js
```

#### **Step 4: Test Individual Components**
```bash
# Test backend only
npm install
node server.js

# Test frontend only
cd client
npm install
npm run build
```

### 8. Alternative Deployment Methods

If Railway continues to fail, try these alternatives:

#### **Docker Deployment:**
```bash
docker build -t telegram-bot-platform .
docker run -p 3001:3001 telegram-bot-platform
```

#### **Manual Deployment:**
```bash
# On your server
git clone <repository>
npm run install:all
npm run build
npm start
```

#### **Other Platforms:**
- **Render:** Supports Node.js apps with automatic builds
- **Railway:** Alternative configuration files
- **Heroku:** Traditional Node.js deployment
- **DigitalOcean App Platform:** Simple deployment

### 9. Getting Help

If you're still experiencing issues:

1. **Check the build logs** in your deployment platform
2. **Run the verification script:** `node verify-build.js`
3. **Test locally first:** Ensure it works on your machine
4. **Check the deployment guide:** `DEPLOYMENT.md`
5. **Create an issue** with specific error messages

### 10. Quick Fixes

#### **Immediate Solutions:**
1. **Clear and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf client/node_modules client/package-lock.json
   npm run install:all
   ```

2. **Use production install:**
   ```bash
   npm ci --only=production
   cd client && npm ci --only=production
   ```

3. **Force rebuild:**
   ```bash
   npm run build --force
   ```

4. **Check Node.js version:**
   ```bash
   node --version
   npm --version
   ```

Remember: Always test locally before deploying to catch issues early!