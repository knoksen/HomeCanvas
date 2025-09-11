/**
 * Simple Express proxy to hide Gemini API key from clients.
 * NOTE: This is a minimal implementation; for production add:
 *  - Auth / rate limiting / logging
 *  - Input validation & size limits
 *  - Caching where appropriate
 */
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(helmet());

// Basic rate limiting (adjust windowMs / max as needed)
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
  app.use('/api/', limiter);

// Body size limit configurable via env (default 6mb)
const bodyLimit = process.env.PROXY_MAX_REQUEST_MB ? `${process.env.PROXY_MAX_REQUEST_MB}mb` : '6mb';
  app.use(express.json({ limit: bodyLimit }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('[proxy] Missing GEMINI_API_KEY in environment');
}

// Generic forward for generateContent endpoints
  app.post('/api/gemini/:model', async (req, res) => {
  try {
    // Optional bearer token auth
    const requiredToken = process.env.PROXY_ACCESS_TOKEN;
    if (requiredToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization bearer token' });
      }
      const provided = authHeader.substring('Bearer '.length).trim();
      if (provided !== requiredToken) {
        return res.status(403).json({ error: 'Invalid bearer token' });
      }
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }
    const { model } = req.params;

    // Basic shape validation to avoid unexpected huge payloads
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    const contents = (req.body as any).contents;
    if (!Array.isArray(contents)) {
      return res.status(400).json({ error: 'Missing contents array' });
    }
    if (contents.length > 4) {
      return res.status(413).json({ error: 'Too many contents parts' });
    }
    const rawSize = JSON.stringify(req.body).length;
    const maxBytes = (parseInt(process.env.PROXY_MAX_REQUEST_KB || '900') * 1024);
    if (rawSize > maxBytes) {
      return res.status(413).json({ error: 'Payload too large' });
    }
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const started = Date.now();
  const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await upstream.json();
  const ms = Date.now() - started;
  console.log(JSON.stringify({ level: 'info', msg: 'proxy_forward', model, status: upstream.status, ms }));
    res.status(upstream.status).json(data);
  } catch (err) {
  console.error(JSON.stringify({ level: 'error', msg: 'proxy_error', error: (err as Error).message }));
    res.status(500).json({ error: 'Proxy request failed' });
  }
  });

// Simple health & version endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: process.env.npm_package_version || 'dev', time: new Date().toISOString() });
  });
  return app;
};
// Only start server if not disabled (useful for tests)
if (process.env.RUN_PROXY_SERVER !== 'false') {
  const app = createApp();
  const port = process.env.PORT || 8787;
  app.listen(port, () => {
    console.log(`[proxy] listening on :${port}`);
  });
}
