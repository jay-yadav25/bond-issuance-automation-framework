import { test as base } from 'playwright-bdd';
import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import env from './env';

type TestData = Record<string, unknown>;
export type ScenarioState = Record<string, unknown>;

function featureNameFromTestFile(testFile: string): string {
  return path.basename(testFile)
    .replace(/\.(spec|test)\.[^.]+$/, '')
    .replace(/\.feature$/, '');
}

function loadTestData(testFile: string): TestData {
  const feature = featureNameFromTestFile(testFile);
  const dataPath = path.resolve(__dirname, env.environment, feature, 'testData.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Test data not found for ${env.environment}/${feature}: ${dataPath}`);
  }

  return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as TestData;
}

export const test = base.extend<{ testData: TestData; state: ScenarioState }>({
  testData: async ({}, use, testInfo) => {
    await use(loadTestData(testInfo.file));
  },
  state: async ({}, use) => {
    await use({});
  }
});

export { expect };