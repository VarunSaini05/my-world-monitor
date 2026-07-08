/**
 * Simple Express server for serving the WorldMonitor SPA on Render
 * Handles all route rewrites to index.html for client-side routing
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files with caching
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: false,
}));

// Specific asset routes with longer cache
app.use('/assets', express.static(join(__dirname, 'dist', 'assets'), {
  maxAge: '1y',
  etag: false,
}));

app.use('/favico', express.static(join(__dirname, 'dist', 'favico'), {
  maxAge: '7d',
  etag: false,
}));

// API proxy - if needed, add API routes here
// For now, API calls should go directly to the origin server

// Handle /pro path for the pro app
app.get('/pro*', (req, res) => {
  const file = join(__dirname, 'dist', 'pro', 'index.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send('Pro app not found');
  }
});

// Handle /blog paths
app.get('/blog*', (req, res) => {
  const file = join(__dirname, 'dist', 'blog', req.path.replace(/^\/blog/, '') || 'index.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.sendFile(join(__dirname, 'dist', 'blog', 'index.html'));
  }
});

// Handle OpenAPI spec
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'openapi.yaml'));
});

// SPA catch-all: rewrite all other routes to index.html for client-side routing
app.get('*', (req, res) => {
  // Don't rewrite actual files
  const file = join(__dirname, 'dist', req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.sendFile(file);
  } else {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`WorldMonitor SPA server running on http://localhost:${PORT}`);
});
