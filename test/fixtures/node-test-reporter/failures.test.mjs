import { describe, test } from 'node:test';

describe('broken suite', () => {
  test.beforeEach(() => {
    throw new Error('controlled hook failure');
  });

  test('hook target', () => {});
});

test('direct test failure', () => {
  throw new Error('controlled test failure');
});
