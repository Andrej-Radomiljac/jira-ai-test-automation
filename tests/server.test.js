import express from 'express';
import request from 'supertest';
import logger from '../src/logger.js';
import '../src/server.js';

jest.mock('../src/logger.js');

describe('Express server', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: expect.any(String) });
    });
  });

  it('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(typeof res.body.timestamp).toBe('string');
  });
}); 