/**
 * Simple Express proxy to hide Gemini API key from clients.
 * NOTE: This is a minimal implementation; for production add:
 *  - Auth / rate limiting / logging
 *  - Input validation & size limits
 *  - Caching where appropriate
 */
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

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
