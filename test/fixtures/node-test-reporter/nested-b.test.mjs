import { describe, test } from 'node:test';

describe('other outer', () => {
  describe('inner', () => {
    test('duplicate name', () => {});
  });
});
