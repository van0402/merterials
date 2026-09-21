import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePostSaveRedirect } from '../../src/lib/profile-redirect';

test('uses the explicit return page when provided', () => {
  assert.equal(resolvePostSaveRedirect('/admin/companies'), '/admin/companies');
});

test('falls back to supplier dashboard when no return page is provided', () => {
  assert.equal(resolvePostSaveRedirect(), '/supplier/dashboard');
});
