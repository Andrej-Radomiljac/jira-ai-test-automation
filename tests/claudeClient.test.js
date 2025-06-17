import ClaudeClient from '../src/clients/claudeClient.js';
import fetch from 'node-fetch';

jest.mock('node-fetch');

describe('ClaudeClient', () => {
  const apiKey = 'test-key';
  const client = new ClaudeClient(apiKey);

  afterEach(() => jest.clearAllMocks());

  it('should generate Playwright test code', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: 'test code' }] })
    });
    const code = await client.generatePlaywrightTest({
      ticketKey: 'PROJ-1',
      summary: 'Login',
      description: 'desc',
      acceptanceCriteria: ['should login'],
      issueType: 'Story',
    });
    expect(code).toBe('test code');
  });

  it('should throw on missing fields', async () => {
    await expect(client.generatePlaywrightTest({})).rejects.toThrow();
  });

  it('should handle Claude API errors', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many', text: async () => 'rate limit' });
    await expect(client.generatePlaywrightTest({
      ticketKey: 'PROJ-1',
      summary: 'Login',
      description: 'desc',
      acceptanceCriteria: ['should login'],
      issueType: 'Story',
    })).rejects.toThrow('Claude API error');
  });
}); 