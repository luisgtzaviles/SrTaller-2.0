import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('AGENTS routes current execution to the Work Unit and not CURRENT_STATE', async () => {
  const agents = await read('AGENTS.md');
  assert.match(agents, /docs\/work\/ACTIVE_CHECKLIST\.md/u);
  assert.match(agents, /docs\/delivery\/SOURCE_OF_TRUTH\.md/u);
  assert.doesNotMatch(agents, /\]\(docs\/CURRENT_STATE\.md\)/u);
});

test('CURRENT_STATE is a compatibility pointer, never an operational snapshot', async () => {
  const currentState = await read('docs/CURRENT_STATE.md');
  assert.match(currentState, /DEPRECATED \/ NOT AUTHORITATIVE/u);
  assert.match(currentState, /SOURCE_OF_TRUTH\.md/u);
  assert.doesNotMatch(currentState, /Current PBI:|exact-main CI|Preview URL/u);
});

test('current governance has one source matrix and no duplicate closure state', async () => {
  const [sourceOfTruth, workflow, lifecycle, done] = await Promise.all([
    read('docs/delivery/SOURCE_OF_TRUTH.md'),
    read('docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md'),
    read('docs/delivery/WORK_UNIT_LIFECYCLE.md'),
    read('docs/delivery/DEFINITION_OF_DONE.md'),
  ]);

  for (const fact of [
    'Prioridades de producto',
    'Work Unit actual',
    'Estado de PR/review/merge',
    'Estado de CI',
    'SHA/artefacto desplegado',
    'Salud del ambiente',
  ]) assert.ok(sourceOfTruth.includes(fact), `source matrix must include ${fact}`);

  const currentContracts = `${workflow}\n${lifecycle}\n${done}`;
  assert.doesNotMatch(currentContracts, /Done Candidate/iu);
  assert.doesNotMatch(currentContracts, /empresasgalatech/iu);
  assert.doesNotMatch(currentContracts, /closure PR.*(?:obligatori|required|default)/iu);
  assert.match(lifecycle, /ACTIVE_CHECKLIST/u);
  assert.match(lifecycle, /work-unit:close/u);
  assert.match(lifecycle, /ref Git de cierre/u);
  assert.match(done, /evidencia no derivable/u);
});

test('authoritative pull-request workflow rejects a non-promotion Work Unit snapshot', async () => {
  const workflow = await read('.github/workflows/authoritative-linux-ci.yml');
  assert.match(workflow, /check-work-unit\.mjs[\s\\]*\n[\s\\]*--mode PROMOTION/u);
  assert.match(workflow, /--branch "\$\{\{ github\.head_ref \}\}"/u);
});
