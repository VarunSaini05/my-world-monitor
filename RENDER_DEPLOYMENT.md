# Deploying WorldMonitor to Render

This guide explains how to deploy the WorldMonitor SPA to Render.com.

## Prerequisites

1. A Render account (https://render.com)
2. This repository pushed to GitHub
3. Environment variables configured (see below)

## Quick Start

### 1. Connect Your Repository

1. Go to https://dashboard.render.com/
2. Click "Create +" → "Web Service"
3. Connect your GitHub account and select this repository
4. Choose the branch (typically `main`)

### 2. Configure the Service

In the Render dashboard, set:

- **Name**: `worldmonitor-app` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node server.mjs`
- **Plan**: Pro ($12/month) or higher

### 3. Set Environment Variables

In the Render dashboard under **Environment**, add:

```
NODE_ENV=production
```

If you need to proxy API calls to another service, update `server.mjs` accordingly.

### 4. Deploy

Click **Create Web Service** and Render will:
1. Clone your repository
2. Run `npm ci && npm run build`
3. Start the Express server with `node server.mjs`
4. Assign you a URL like `worldmonitor-app.onrender.com`

## What Gets Deployed

The deployment includes:

- **Frontend SPA**: Built Vite app from `dist/`
- **Static assets**: JS bundles, CSS, images, blog pages
- **Blog**: Astro-built blog copied to `public/blog/`
- **Pro app**: Optional pro dashboard if built

## Customizing the Deployment

### API Integration

If you need to route API calls to your backend:

Edit `server.mjs` and add API routes:

```javascript
app.get('/api/*', async (req, res) => {
  const apiUrl = process.env.API_BASE_URL || 'https://api.worldmonitor.app';
  const target = `${apiUrl}${req.path}`;
  // Proxy the request
});
```

### Custom Domain

1. Add your domain in Render dashboard under **Settings** → **Custom Domains**
2. Update your DNS records as instructed by Render

### Environment Variants

To deploy different variants (tech, finance, etc.), create separate services in Render, each with:

```
Build Command: npm ci && cross-env VITE_VARIANT=tech npm run build
```

## Monitoring

In Render dashboard, you can:

- View logs in real-time
- Monitor CPU/memory usage
- Check deployment history
- Set up error notifications

## Cost

- **Pro plan**: ~$12/month (recommended for production)
- **Starter plan**: ~$7/month (suitable for testing)
- Auto-pause on free tier (not recommended for public sites)

## Troubleshooting

### Build fails with "npm ci" error

Check that:
- Node.js version is compatible (18+ recommended)
- All dependencies are properly declared in package.json
- No private npm packages are used without proper auth

### App doesn't load

Check:
- Health check is passing (should see "Health check passed" in logs)
- Static files are being served correctly
- Browser console for any asset loading errors

### Too slow / High CPU usage

- Upgrade to a higher tier
- Check for memory leaks in the app
- Consider caching headers for static assets

## Next Steps

- Set up CI/CD GitHub Actions for automated testing before deployment
- Configure CDN/caching headers in `server.mjs`
- Monitor performance and errors
- Set up auto-deploy on git push (enabled by default in Render)

## Documentation

- Render Docs: https://render.com/docs
- This Project: See AGENTS.md for architecture details
