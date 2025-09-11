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

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[proxy] request failed', err);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[proxy] listening on :${port}`);
});
