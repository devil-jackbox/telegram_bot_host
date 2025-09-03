# Telegram Bot Hosting Platform

A modern, web-based platform to create, run, and manage Telegram bots with your own code. It’s optimized for JavaScript bots, offers a powerful in-browser editor, and gives you real‑time logs, errors, and environment variable management.

## 🔑 Highlights

- **JavaScript bot runtime** using `node-telegram-bot-api`
- **Web IDE** with Monaco Editor, fullscreen mode, and Android-friendly long‑press selection (textarea fallback on Android)
- **Real-time control**: start/stop/restart bots, instant status updates via Socket.IO
- **Live logs and errors** per bot, with copy-to-clipboard
- **Environment variables** with auto-detection from your code and manual editing
- **Process isolation**: each bot runs in its own process with PID tracking
- **Docker and Railway deployment** ready

## 🧱 Tech Stack

- Backend: Node.js, Express, Socket.IO
- Frontend: React, Tailwind CSS, Monaco Editor
- Telegram: `node-telegram-bot-api`
- Packaging: Docker (Node 18 Alpine), Railway

## 📂 Project Structure

```
telegram-bot-hosting-platform/
├── server.js                 # Main server entry point (Express + Socket.IO)
├── src/
│   ├── botManager.js        # Bot lifecycle and process mgmt
│   ├── routes/
│   │   ├── bots.js          # Create/Update/Delete/Start/Stop
│   │   ├── files.js         # Read/Write bot files
│   │   └── logs.js          # Retrieve logs
│   └── utils/logger.js      # Winston logger
├── client/                  # React app
│   ├── src/
│   │   ├── pages/           # Dashboard, BotEditor, Logs, Errors, Settings
│   │   ├── components/      # Layout, modals, etc.
│   │   └── contexts/        # BotContext, SocketContext
│   └── public/
├── Dockerfile               # Docker build (Node 18 Alpine)
├── railway.json             # Railway service config
└── start.sh                 # App start script
```

## ✨ Features (Detailed)

- **Bot creation**: Name + token + optional initial code. Platform stores a per-bot folder with `bot.js` and `config.json`.
- **Code editor**:
  - Monaco Editor on desktop; textarea fallback on Android enables native long‑press selection (copy/cut/paste/select).
  - Fullscreen toggle.
  - Auto layout, line numbers, dark theme.
- **Environment variables**:
  - Auto‑detects variables used in your code (`process.env.VAR_NAME`).
  - Add/remove/edit variables. Mark as secret to obscure value in the UI.
  - No special handling for `PROTECT_CONTENT`; it’s treated like any other variable and only appears if you add it or your code references it.
- **Logs & errors**: Real-time streaming; copy errors with one tap/click.
- **Lifecycle control**: Start/Stop/Restart with immediate status updates.
- **Resiliency**: Message de‑duplication and basic rate limiting in the default bot template.

## 🧪 Local Development

### Prerequisites

- Node.js 18+
- npm

### Steps

1) Clone and install
```bash
git clone <repository-url>
cd telegram-bot-hosting-platform
npm install
cd client && npm install && cd ..
```

2) Start (concurrently runs server and client)
```bash
npm run dev
```

3) Open the app
```
http://localhost:3000
```

## ⚙️ Platform Environment Variables

These configure the hosting platform itself (not your bot code):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` (Dockerfile) |
| `NODE_ENV` | Node environment | `production` in Docker |
| `LOG_LEVEL` | Logger level | `info` |
| `HOST` | Bind host | `0.0.0.0` |

Note: The platform applies sane defaults at runtime; you can override them via deployment env vars.

## 🤖 Creating and Running a Bot

1) Obtain a token from [@BotFather](https://t.me/botfather).
2) Click “Create Bot”, fill name/token, and optionally paste your code or start with the template.
3) Open the bot’s page > Code Editor to edit and save.
4) Use Environment Variables tab to add variables your code expects. The UI auto‑detects variables referenced in your code (via `process.env.*`).
5) Start the bot. Watch Logs and Errors in real time.

### Example: Using an env var in your code
```js
const shouldProtect = String(process.env.PROTECT_CONTENT || 'false').toLowerCase() === 'true';
bot.sendMessage(chatId, 'Hello', { protect_content: shouldProtect });
```

## 🚀 Deployment

### Railway (Recommended)

1) Fork this repo and connect it to Railway.
2) Add platform env vars as needed (e.g., `PORT`, `LOG_LEVEL`).
3) Deploy. Railway builds the Docker image and starts the app.

### Docker (Manual)
```bash
docker build -t telegram-bot-platform .
docker run -p 3001:3001 --env PORT=3001 telegram-bot-platform
```

The Dockerfile uses Node 18 Alpine and installs only `tzdata` and `git` to keep the image slim. If you add native modules that require compilation, consider a multi‑stage build that installs `build-base` for the build stage.

## 🔌 API Endpoints (High Level)

- `GET /api/bots` – List bots
- `POST /api/bots` – Create bot (name, token, code?, autoStart?)
- `PUT /api/bots/:botId` – Update bot metadata or env vars
- `DELETE /api/bots/:botId` – Delete bot
- `GET /api/bots/:botId/file` / `PUT /api/bots/:botId/file` – Read/write code
- `POST /api/bots/:botId/start` / `POST /api/bots/:botId/stop` – Control runtime
- `GET /api/bots/:botId/logs` – Retrieve logs

## 🧩 Editor Tips

- Android: the editor uses a textarea fallback for native long‑press selection with the familiar copy/cut/paste/select popup.
- Desktop: Monaco Editor with dark theme, line numbers, folding, and fullscreen.

## 🛡️ Security

- CORS + Helmet + rate limiting
- Process isolation per bot (child process)
- Secrets masking in the UI for marked env variables

## 🧰 Troubleshooting

- Docker build fails installing compilers or Python on Alpine:
  - This repo’s Dockerfile intentionally avoids heavy toolchains. If you add native deps, switch to a multi‑stage build and install `apk add --no-cache build-base` in the build stage only.
- Bot doesn’t start:
  - Check the Errors tab for stack traces.
  - Ensure required env variables (e.g., `BOT_TOKEN`) are present.
- Env variable not appearing:
  - The UI detects variables used in code (via `process.env.*`). You can also add any variable manually.

## 📝 License

MIT License. See `LICENSE` if present.

## 🙌 Acknowledgments

- Monaco Editor
- Tailwind CSS
- Socket.IO
- Railway
- node-telegram-bot-api

— Built for Telegram bot developers who want speed, control, and simplicity.


![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/devil-jackbox/telegram-bots?utm_source=oss&utm_medium=github&utm_campaign=devil-jackbox%2Ftelegram-bots&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
