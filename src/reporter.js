import logger from './logger.js';

/**
 * Report test results to Jira as a comment
 * @param {JiraClient} jiraClient
 * @param {string} issueKey
 * @param {object} results
 */
export async function reportResultsToJira(jiraClient, issueKey, results) {
  try {
    const { status, results: testResults, error } = results;
    let comment = '';
    if (status === 'error') {
      comment = `❌ Test execution failed: ${error}`;
    } else {
      comment = `🧪 Playwright Test Results:\n\nStatus: ${status}\n\nResults:\n


































testResults: ${JSON.stringify(testResults, null, 2)}`;
    }
    await jiraClient.addComment(issueKey, comment);
    logger.info(`Reported results to Jira issue ${issueKey}`);
  } catch (err) {
    logger.error(`Failed to report results to Jira: ${err.message}`);
  }
} 