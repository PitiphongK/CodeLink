# Deployment Guide - Hybrid Architecture

This project uses a hybrid deployment strategy:
- **Frontend + APIs**: Vercel (Next.js)
- **Terminal Server**: Railway, Render, or any Node.js hosting

## Why Hybrid?

Your terminal feature requires:
- Real-time WebSocket connections (`socket.io`)
- Long-lived processes (`node-pty`)
- Full Node.js runtime

These don't work on Vercel's serverless functions. The hybrid approach lets you deploy the frontend to Vercel while keeping a minimal, cost-effective terminal server elsewhere.

---

## Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Redis** (required):
   ```bash
   redis-server  # or use Docker: docker run -p 6379:6379 redis
   ```

3. **Terminal in one terminal window**:
   ```bash
   pnpm dev:server
   ```
   Runs on `http://localhost:4000`

4. **Next.js app in another window**:
   ```bash
   pnpm dev
   ```
   Runs on `http://localhost:3000`

5. **View `.env.local`** (create if it doesn't exist):
   ```bash
   REDIS_URL=redis://localhost:6379
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```

---

## Production Deployment

### Step 1: Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and create a new project
3. Import your repository
4. Set environment variables:
   - `REDIS_URL`: Your production Redis URL (use [Redis Cloud](https://redis.com/try-free/) or similar)
   - `NEXT_PUBLIC_SOCKET_URL`: URL of your terminal server (see Step 2)
5. Deploy

### Step 2: Deploy Terminal Server to Railway (Recommended)

**Option A: Using Railway CLI** (fastest)

```bash
npm install -g @railway/cli
railway login
railway init --name code-link-terminal
railway up
```

Then get the public URL and add it to Vercel's `NEXT_PUBLIC_SOCKET_URL`.

**Option B: Using Railway Web UI**

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Create a new service from GitHub repo
4. Configure:
   - Build command: `pnpm install && pnpm build:server`
   - Start command: `pnpm start:server`
5. Add variables:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `CORS_ORIGIN`: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
6. Deploy and copy the public URL
7. Add to Vercel environment: `NEXT_PUBLIC_SOCKET_URL=<railway-url>`

### Step 3: Deploy Terminal Server to Render (Alternative)

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Build command: `pnpm install && pnpm build:server`
   - Start command: `pnpm start:server`
5. Add environment variables (see render.yaml)
6. Deploy
7. Copy the public URL and add to Vercel's `NEXT_PUBLIC_SOCKET_URL`

---

## Environment Variables Checklist

### Vercel (Frontend)
- `REDIS_URL` - Production Redis connection
- `NEXT_PUBLIC_SOCKET_URL` - Terminal server URL (e.g., `https://terminal-server-abc.railway.app`)

### Railway/Render (Terminal Server)
- `NODE_ENV=production`
- `PORT=4000` (or use default)
- `CORS_ORIGIN` - Your Vercel app domain

---

## Monitoring

### Check Vercel Logs
```bash
vercel logs  # See Next.js app logs
```

### Check Railway/Render Logs
- Railway: Dashboard → Project → Logs
- Render: Dashboard → Service → Logs

### Test Connection
Visit your Vercel app and open the terminal feature. Check the browser console for connection errors.

---

## Cost Estimate

- **Vercel**: Free tier (12 function invocations/second) → $0-20/month
- **Railway**: Free tier 500 hours/month → $5/month after  
- **Redis Cloud**: Free tier (30 MB) → $0-15/month
- **Total**: ~$5-35/month (very cheap!)

---

## Troubleshooting

**Terminal not connecting?**
- Check `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Verify CORS_ORIGIN in terminal server includes your Vercel domain
- Check browser Network tab for WebSocket connection

**Terminal server crashes?**
- Check Railway/Render logs for errors
- Verify `NODE_ENV=production` is set
- Ensure no hardcoded localhost URLs

**Can't build terminal server?**
- Run `pnpm build:server` locally to test
- Check `tsconfig.server.json` exists and is correct
- Verify all imports resolve properly

---

## Next Steps

1. Get a production Redis (Railway provides one, or use Redis Cloud)
2. Deploy terminal server first to Railway/Render
3. Copy the public URL
4. Deploy Vercel with `NEXT_PUBLIC_SOCKET_URL` set to that URL
5. Test the terminal feature in your live app
