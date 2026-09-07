import assert from 'node:assert/strict';
import test from 'node:test';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../dist/app.module.js';
import { HealthReadiness } from '../dist/health/health-readiness.service.js';

test('health endpoints expose bounded liveness and bootstrap readiness', async () => {
  const previousPinPepper = process.env.SR_PIN_PEPPER;
  process.env.SR_PIN_PEPPER = Buffer.alloc(32, 0x34).toString('base64url');
  let application;
  try {
    application = await NestFactory.create(AppModule, { logger: false });
    await application.listen(0, '127.0.0.1');
    const address = application.getHttpServer().address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const live = await fetch(`${baseUrl}/livez`);
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: 'live' });

    const starting = await fetch(`${baseUrl}/readyz`);
    assert.equal(starting.status, 503);
    assert.deepEqual(await starting.json(), { status: 'starting' });

    const readiness = application.get(HealthReadiness);
    readiness.attachDependency({
      async checkReady() {
        return true;
      },
    });
    readiness.markReady();
    const ready = await fetch(`${baseUrl}/readyz`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: 'ready' });

    readiness.markNotReady();
    const unavailable = await fetch(`${baseUrl}/readyz`);
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { status: 'starting' });

    const unknown = await fetch(`${baseUrl}/unknown`);
    assert.equal(unknown.status, 404);
  } finally {
    await application?.close();
    if (previousPinPepper === undefined) delete process.env.SR_PIN_PEPPER;
    else process.env.SR_PIN_PEPPER = previousPinPepper;
  }
});
