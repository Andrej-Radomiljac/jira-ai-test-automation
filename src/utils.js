/**
 * Validate if the payload is a valid Jira webhook event for status change to 'Testing'.
 * @param {object} payload
 * @returns {boolean}
 */
export function isValidJiraWebhook(payload) {
  if (!payload || !payload.issue || !payload.changelog) return false;
  const statusChange = payload.changelog.items?.find(
    (item) => item.field === 'status' && item.toString === 'Testing'
  );
  return Boolean(statusChange);
}

/**
 * Exponential backoff utility for retries.
 * @param {function} fn - The async function to retry
 * @param {number} retries - Number of attempts
 * @param {number} delay - Initial delay in ms
 */
export async function withExponentialBackoff(fn, retries = 3, delay = 500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay * 2 ** attempt));
      attempt++;
    }
  }
} 