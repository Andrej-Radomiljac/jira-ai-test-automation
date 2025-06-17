import fs from 'fs/promises';
import path from 'path';
import { test as base, runCLI } from '@playwright/test';
import logger from './logger.js';

const GENERATED_DIR = path.resolve('generated-tests');

/**
 * TestRunner for saving and executing Playwright tests.
 */
class TestRunner {
  /**
   * Save test code to a uniquely named file
   * @param {string} ticketKey
   * @param {string} testCode
   * @returns {Promise<string>} File path
   */
  async saveTestFile(ticketKey, testCode) {
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    const fileName = `${ticketKey}-${Date.now()}.spec.js`;
    const filePath = path.join(GENERATED_DIR, fileName);
    await fs.writeFile(filePath, testCode, 'utf8');
    logger.info(`Saved test file: ${filePath}`);
    return filePath;
  }

  /**
   * Run Playwright tests programmatically
   * @param {string} testFilePath
   * @returns {Promise<object>} Results object
   */
  async runTest(testFilePath) {
    try {
      logger.info(`Running Playwright test: ${testFilePath}`);
      const result = await runCLI({
        config: 'playwright.config.js',
        testDir: GENERATED_DIR,
        report: 'json',
        _: [testFilePath],
      }, [process.cwd()]);
      return {
        status: result.status,
        results: result.results,
        output: result.output,
      };
    } catch (err) {
      logger.error(`TestRunner error: ${err.message}`);
      return { status: 'error', error: err.message };
    }
  }
}

export default TestRunner; 