import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }) };
  }
  try {
    const model = event.queryStringParameters?.model;
    if (!model) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing model query parameter' }) };
    }
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const body = event.body || '{}';
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const data = await upstream.text();
    return { statusCode: upstream.status, body: data, headers: { 'Content-Type': 'application/json' } };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Proxy error' }) };
  }
};
