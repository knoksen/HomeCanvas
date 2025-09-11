import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/proxy';

// Minimal tests for proxy health & auth behavior

describe('proxy server', () => {
  const app = createApp();

  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.version).toBe('string');
  });

  it('rejects missing bearer token when PROXY_ACCESS_TOKEN set', async () => {
    process.env.PROXY_ACCESS_TOKEN = 'secret';
    const securedApp = createApp();
    const res = await request(securedApp).post('/api/gemini/test-model').send({ contents: [] });
    expect(res.status).toBe(401);
  });

  it('accepts valid bearer token', async () => {
    process.env.PROXY_ACCESS_TOKEN = 'secret2';
    const securedApp = createApp();
    const res = await request(securedApp)
      .post('/api/gemini/test-model')
      .set('Authorization', 'Bearer secret2')
      .send({ contents: [] });
    // Will fail upstream due to missing GEMINI_API_KEY or invalid call; ensure 500 or 400 style not auth error
    expect([400,500]).toContain(res.status);
    // Clean up
    delete process.env.PROXY_ACCESS_TOKEN;
  });
});
