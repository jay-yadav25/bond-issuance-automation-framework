import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/test';
import env from '../../fixtures/env';

function extractRole(title: string): string | undefined {
  return title.match(/\["([^\"]+)"\]/)?.[1];
}

function targetRoles(): string[] {
  return env.TARGET_ROLES_FILTER
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

export function createBddCustom() {
  const { Given, When, Then, Before, After } = createBdd(test);

  Before(async ({ $testInfo }) => {
    const tags = (($testInfo as { tags?: string[] } | undefined)?.tags || []);
    if (tags.includes('@wip') && process.env.RUN_UI !== 'true') {
      test.skip();
      return;
    }

    const role = extractRole($testInfo?.title || '');
    const roles = targetRoles();

    if (role && roles.length > 0 && !roles.some((targetRole) => role.startsWith(targetRole))) {
      test.skip();
    }
  });

  return { Given, When, Then, Before, After };
}