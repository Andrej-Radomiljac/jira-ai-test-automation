import { isValidJiraWebhook, withExponentialBackoff } from '../src/utils.js';

describe('utils', () => {
  describe('isValidJiraWebhook', () => {
    it('returns true for valid payload', () => {
      const payload = {
        issue: { key: 'PROJ-1' },
        changelog: { items: [{ field: 'status', toString: 'Testing' }] }
      };
      expect(isValidJiraWebhook(payload)).toBe(true);
    });
    it('returns false for invalid payload', () => {
      expect(isValidJiraWebhook({})).toBe(false);
      expect(isValidJiraWebhook(null)).toBe(false);
    });
  });

  describe('withExponentialBackoff', () => {
    it('retries and succeeds', async () => {
      let count = 0;
      const fn = jest.fn().mockImplementation(() => {
        if (count++ < 2) throw new Error('fail');
        return 'ok';
      });
      const result = await withExponentialBackoff(fn, 3, 10);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });
    it('throws after max retries', async () => {
      const fn = jest.fn().mockImplementation(() => { throw new Error('fail'); });
      await expect(withExponentialBackoff(fn, 2, 10)).rejects.toThrow('fail');
    });
  });
}); 