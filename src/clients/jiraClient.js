import fetch from 'node-fetch';
import logger from '../logger.js';
import { withExponentialBackoff } from '../utils.js';

/**
 * JiraClient for interacting with Jira Cloud and Server/DC APIs.
 */
class JiraClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl
   * @param {string} options.username
   * @param {string} options.apiToken
   */
  constructor({ baseUrl, username, apiToken }) {
    if (!baseUrl || !username || !apiToken) {
      throw new Error('JiraClient: Missing required configuration');
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.apiToken = apiToken;
    this.isCloud = this.baseUrl.includes('atlassian.net');
  }

  /**
   * Get issue details by key
   * @param {string} issueKey
   * @returns {Promise<object>}
   */
  async getIssue(issueKey) {
    if (!issueKey) throw new Error('getIssue: issueKey required');
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}`;
    return withExponentialBackoff(() => this._fetch(url), 3, 500);
  }

  /**
   * Add a comment to an issue
   * @param {string} issueKey
   * @param {string} comment
   * @returns {Promise<object>}
   */
  async addComment(issueKey, comment) {
    if (!issueKey || !comment) throw new Error('addComment: issueKey and comment required');
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`;
    const body = JSON.stringify({ body: comment });
    return withExponentialBackoff(() => this._fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }), 3, 500);
  }

  /**
   * Search issues by JQL
   * @param {string} jql
   * @returns {Promise<object>}
   */
  async searchIssues(jql) {
    if (!jql) throw new Error('searchIssues: jql required');
    const url = `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`;
    return withExponentialBackoff(() => this._fetch(url), 3, 500);
  }

  /**
   * Internal fetch with authentication and error handling
   * @private
   */
  async _fetch(url, options = {}) {
    const headers = options.headers || {};
    if (this.isCloud) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    } else {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const text = await res.text();
        logger.error(`Jira API error: ${res.status} ${res.statusText} - ${text}`);
        throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      logger.error(`JiraClient fetch error: ${err.message}`);
      throw err;
    }
  }
}

export default JiraClient; 