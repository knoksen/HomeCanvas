import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }
  try {
    const modelMatch = (req.query as any).model || (req.url?.split('/').pop());
    const model = Array.isArray(modelMatch) ? modelMatch[0] : modelMatch;
    if (!model) return res.status(400).json({ error: 'Missing model segment' });

    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Proxy error' });
  }
}
