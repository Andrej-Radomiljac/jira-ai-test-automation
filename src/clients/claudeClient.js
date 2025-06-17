import fetch from 'node-fetch';
import logger from '../logger.js';
import { withExponentialBackoff } from '../utils.js';

/**
 * ClaudeClient for generating Playwright tests using Anthropic Claude API.
 */
class ClaudeClient {
  /**
   * @param {string} apiKey
   */
  constructor(apiKey) {
    if (!apiKey) throw new Error('ClaudeClient: API key required');
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Generate Playwright test code from Jira issue data
   * @param {object} params
   * @param {string} params.ticketKey
   * @param {string} params.summary
   * @param {string} params.description
   * @param {string[]} params.acceptanceCriteria
   * @param {string} params.issueType
   * @returns {Promise<string>} Playwright test code
   */
  async generatePlaywrightTest({ ticketKey, summary, description, acceptanceCriteria, issueType }) {
    if (!ticketKey || !summary || !description) throw new Error('Missing required fields for test generation');
    const prompt = this._buildPrompt({ ticketKey, summary, description, acceptanceCriteria, issueType });
    return withExponentialBackoff(() => this._callClaude(prompt), 3, 1000);
  }

  /**
   * Build the Claude prompt for test generation
   * @private
   */
  _buildPrompt({ ticketKey, summary, description, acceptanceCriteria, issueType }) {
    return `You are an expert Playwright test developer.\n\nGenerate a complete Playwright test file for the following Jira ticket:\n\nTicket: ${ticketKey}\nSummary: ${summary}\nType: ${issueType}\nDescription: ${description}\nAcceptance Criteria:\n${(acceptanceCriteria || []).map((c, i) => `- ${c}`).join('\n')}\n\nRequirements:\n- Use best practices for Playwright\n- Cover all acceptance criteria\n- Add comments for each test step\n- Use async/await\n- Do not include any explanations, only output the test code`;
  }

  /**
   * Call Claude API to generate test code
   * @private
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async _callClaude(prompt) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 2048,
          temperature: 0.2,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!res.ok) {
        const text = await res.text();
        logger.error(`Claude API error: ${res.status} ${res.statusText} - ${text}`);
        throw new Error(`Claude API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // Claude returns {content: [{type: 'text', text: '...'}]}
      const code = data.content?.[0]?.text || '';
      if (!code) throw new Error('Claude API returned empty content');
      return code;
    } catch (err) {
      logger.error(`ClaudeClient error: ${err.message}`);
      throw err;
    }
  }
}

export default ClaudeClient; 