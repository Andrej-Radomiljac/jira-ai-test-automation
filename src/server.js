import express from 'express';
import dotenv from 'dotenv';
import JiraClient from './clients/jiraClient.js';
import ClaudeClient from './clients/claudeClient.js';
import TestRunner from './testRunner.js';
import { reportResultsToJira } from './reporter.js';
import logger from './logger.js';
import { isValidJiraWebhook } from './utils.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main webhook endpoint
app.post('/webhook/jira', async (req, res) => {
  logger.info('🔔 Received Jira webhook');
  const payload = req.body;
  if (!isValidJiraWebhook(payload)) {
    logger.warn('Invalid Jira webhook payload');
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
  const issueKey = payload.issue.key;
  logger.info(`🎯 Issue ${issueKey} moved to testing`);

  // Setup clients
  const jiraClient = new JiraClient({
    baseUrl: process.env.JIRA_URL,
    username: process.env.JIRA_USERNAME,
    apiToken: process.env.JIRA_API_TOKEN,
  });
  const claudeClient = new ClaudeClient(process.env.ANTHROPIC_API_KEY);
  const testRunner = new TestRunner();

  try {
    logger.info(`🔍 Processing ticket: ${issueKey}`);
    const issue = await jiraClient.getIssue(issueKey);
    const summary = issue.fields.summary;
    const description = issue.fields.description || '';
    const issueType = issue.fields.issuetype?.name || '';
    // Extract acceptance criteria (simple split for now)
    const acceptanceCriteria = (description.match(/Acceptance Criteria:(.*)/is)?.[1] || '')
      .split(/\n|-/)
      .map(s => s.trim())
      .filter(Boolean);
    logger.info('🤖 Generating tests with Claude...');
    const testCode = await claudeClient.generatePlaywrightTest({
      ticketKey: issueKey,
      summary,
      description,
      acceptanceCriteria,
      issueType,
    });
    logger.info('🧪 Running Playwright tests...');
    const testFilePath = await testRunner.saveTestFile(issueKey, testCode);
    const results = await testRunner.runTest(testFilePath);
    await reportResultsToJira(jiraClient, issueKey, results);
    logger.info(`✅ Completed processing ${issueKey}`);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error(`❌ Error processing ${issueKey}: ${err.message}`);
    await reportResultsToJira(jiraClient, issueKey, { status: 'error', error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  logger.info(`🚀 Server listening on port ${PORT}`);
}); 