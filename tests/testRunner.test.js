import TestRunner from '../src/testRunner.js';
import fs from 'fs/promises';
import * as playwright from '@playwright/test';

jest.mock('fs/promises');
jest.mock('@playwright/test', () => ({ runCLI: jest.fn() }));

describe('TestRunner', () => {
  const runner = new TestRunner();

  afterEach(() => jest.clearAllMocks());

  it('should save test file', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    const filePath = await runner.saveTestFile('PROJ-1', 'test code');
    expect(filePath).toMatch(/PROJ-1-\d+\.spec\.js/);
  });

  it('should run test and return results', async () => {
    playwright.runCLI.mockResolvedValue({ status: 0, results: [], output: 'ok' });
    const res = await runner.runTest('file.spec.js');
    expect(res.status).toBe(0);
    expect(res.output).toBe('ok');
  });

  it('should handle test runner errors', async () => {
    playwright.runCLI.mockRejectedValue(new Error('fail'));
    const res = await runner.runTest('file.spec.js');
    expect(res.status).toBe('error');
    expect(res.error).toBe('fail');
  });
}); 