import { describe, test } from 'node:test';

describe('outer', () => {
  describe('inner', () => {
    test('duplicate name', () => {});
  });

  describe('sibling', () => {
    test('duplicate name', () => {});
  });
});
