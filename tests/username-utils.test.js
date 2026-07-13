import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsername } from '../js/username-utils.js';

test('normalizeUsername preserves the intended capitalization and sanitizes spacing', () => {
  assert.equal(normalizeUsername('  My User  '), 'My_User');
  assert.equal(normalizeUsername('@Venus!'), 'Venus');
  assert.equal(normalizeUsername('___'), 'guest');
  assert.equal(normalizeUsername('  '), 'guest');
});

test('normalizeUsername preserves a provided fallback when input is blank', () => {
  assert.equal(normalizeUsername('', 'guest'), 'guest');
  assert.equal(normalizeUsername('@', 'Noctive_User'), 'Noctive_User');
});
