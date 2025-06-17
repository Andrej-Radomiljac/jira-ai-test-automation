import JiraClient from '../src/clients/jiraClient.js';
import fetch from 'node-fetch';

jest.mock('node-fetch');

describe('JiraClient', () => {
  const config = {
    baseUrl: 'https://example.atlassian.net',
    username: 'user',
    apiToken: 'token',
  };
  const client = new JiraClient(config);

  afterEach(() => jest.clearAllMocks());

  it('should fetch issue details', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ key: 'PROJ-1' }) });
    const issue = await client.getIssue('PROJ-1');
    expect(issue.key).toBe('PROJ-1');
  });

  it('should add a comment', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ id: '10001' }) });
    const res = await client.addComment('PROJ-1', 'Test comment');
    expect(res.id).toBe('10001');
  });

  it('should throw on missing config', () => {
    expect(() => new JiraClient({})).toThrow();
  });

  it('should handle API errors', async () => {
    fetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden', text: async () => 'error' });
    await expect(client.getIssue('PROJ-1')).rejects.toThrow('Jira API error');
  });
}); 