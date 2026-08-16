import assert from 'node:assert/strict';
import test from 'node:test';

const routing = await import('../dist/preview-static-routing.js');

function request({ method = 'GET', path, acceptsHtml = 'html' }) {
  return Object.freeze({
    method,
    path,
    accepts(type) {
      assert.equal(type, 'html');
      return acceptsHtml;
    },
  });
}

test('preview static fallback never captures the governed health endpoint', () => {
  for (const acceptsHtml of ['html', false]) {
    assert.equal(
      routing.shouldServePreviewIndex(request({ path: '/healthz', acceptsHtml })),
      false,
      `GET /healthz must reach HealthController when accepts(html)=${String(
        acceptsHtml,
      )}`,
    );
  }
});

test('preview static fallback preserves SPA routes and excludes API/static paths', () => {
  assert.equal(routing.shouldServePreviewIndex(request({ path: '/' })), true);
  assert.equal(
    routing.shouldServePreviewIndex(request({ path: '/reparaciones' })),
    true,
  );
  assert.equal(
    routing.shouldServePreviewIndex(request({ path: '/api/preview/context' })),
    false,
  );
  assert.equal(
    routing.shouldServePreviewIndex(request({ path: '/assets/index.js' })),
    false,
  );
  assert.equal(
    routing.shouldServePreviewIndex(request({ method: 'POST', path: '/' })),
    false,
  );
});
