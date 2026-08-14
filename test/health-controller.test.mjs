import 'reflect-metadata';

import assert from 'node:assert/strict';
import test from 'node:test';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

const health = await import(
  '../dist/modules/preview/presentation/http/health.controller.js'
);
const runtime = await import('../dist/preview-runtime.service.js');

async function withHealthApplication(ready, action) {
  class HealthTestModule {}
  Module({
    controllers: [health.HealthController],
    providers: [{ provide: runtime.PreviewRuntimeService, useValue: { ready } }],
  })(HealthTestModule);

  const application = await NestFactory.create(HealthTestModule, { logger: false });
  await application.listen(0, '127.0.0.1');
  const address = application.getHttpServer().address();
  assert.ok(address && typeof address === 'object');
  try {
    await action(`http://127.0.0.1:${address.port}`);
  } finally {
    await application.close();
  }
}

test('GET /healthz returns a small deterministic 200 response after initialization', async () => {
  await withHealthApplication(true, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, { status: 'ok' });
    assert.doesNotMatch(
      JSON.stringify(body),
      /(password|secret|stack|database|postgres|host|port)/iu,
    );
  });
});

test('GET /healthz returns 503 before required initialization is complete', async () => {
  await withHealthApplication(false, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.deepEqual(body, { status: 'unavailable' });
    assert.doesNotMatch(
      JSON.stringify(body),
      /(password|secret|stack|database|postgres|host|port)/iu,
    );
  });
});

test('the health surface rejects non-GET and all unapproved diagnostic paths', async () => {
  await withHealthApplication(true, async (baseUrl) => {
    for (const [method, path] of [
      ['POST', '/healthz'],
      ['GET', '/health'],
      ['GET', '/readyz'],
      ['GET', '/metrics'],
      ['GET', '/health-detail'],
    ]) {
      const response = await fetch(`${baseUrl}${path}`, { method });
      assert.equal(response.status, 404, `${method} ${path} must be rejected`);
    }
  });
});
