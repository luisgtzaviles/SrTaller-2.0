import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const styles = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const repository = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const fixtures = await readFile('scripts/lib/local-development.mjs', 'utf8');
const timelineStart = page.indexOf('<section className={styles.repairTimeline}');
const timelineEnd = page.indexOf('<section className={styles.repairConcepts}', timelineStart);
const timeline = page.slice(timelineStart, timelineEnd);

test('history presents the authoritative newest-first order without re-sorting the read model', () => {
  assert.match(repository, /orderBy\('occurred_at', 'desc'\)[\s\S]*?orderBy\('entry_id', 'desc'\)/u);
  assert.match(page, /\[note, \.\.\.current\.timeline\.items\]\.slice\(0, current\.timeline\.limit\)/u);
  assert.match(timeline, /aria-label="Historial de actividad, de la más reciente a la más antigua"/u);
  assert.doesNotMatch(timeline, /\.sort\(|\.reverse\(/u);
});

test('event anatomy keeps time actor title and optional body in one continuous timeline', () => {
  assert.match(page, /function RepairTimelineEntry[\s\S]*?<time dateTime=\{entry\.occurredAt\}>[\s\S]*?timelineActor[\s\S]*?<h3>[\s\S]*?entry\.body \? <p>/u);
  assert.match(page, /function compactTimelineAt[\s\S]*?formatToParts[\s\S]*?timeZone/u);
  assert.match(page, /day: 'numeric'[\s\S]*?month: 'short'[\s\S]*?hour: 'numeric'[\s\S]*?minute: '2-digit'/u);
  assert.doesNotMatch(timeline, /Origen:|timelineSourceLabel|timelineType/u);
  assert.equal((timeline.match(/<ol\b/gu) ?? []).length, 1);
});

test('notes are quieter than cards but remain distinguishable from system events', () => {
  assert.match(page, /<li data-kind=\{entry\.type\}>/u);
  assert.match(styles, /\.timelineList > li\[data-kind="note"\]::before \{[^}]*background: var\(--color-surface\);[^}]*box-shadow: 0 0 0 2px var\(--color-brand-action\)/u);
  assert.match(styles, /\.timelineList > li\[data-kind="note"\] p \{[^}]*border-left: 2px solid var\(--color-brand-border\)/u);
  assert.doesNotMatch(styles, /\.timelineList > li \{[^}]*border-radius|\.timelineList article \{[^}]*border:/u);
});

test('authorized note composer precedes the events and preserves its operational contract', () => {
  const composer = timeline.indexOf('className={styles.noteComposer}');
  const content = timeline.indexOf('className={styles.timelineContent}');
  assert.ok(composer >= 0 && composer < content);
  assert.match(timeline, />Agregar nota operativa<\/label>/u);
  assert.match(timeline, /minLength=\{noteBodyMinLength\}[\s\S]*?maxLength=\{noteBodyMaxLength\}/u);
  assert.match(timeline, /disabled=\{!noteValid \|\| noteSubmitState === 'submitting'\}/u);
  assert.match(timeline, /aria-live="polite"/u);
  assert.match(styles, /\.noteComposerControls \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/u);
  assert.match(styles, /\.noteComposerControls textarea \{ min-height: 52px;/u);
});

test('history has no nested desktop scroll and retains the accepted desktop proportions', () => {
  assert.doesNotMatch(styles, /workspaceOverlay \.repairTimeline \{[^}]*max-height|workspaceOverlay \.timelineContent \{[^}]*overflow-y/u);
  assert.match(styles, /grid-template-columns: minmax\(0, 0\.32fr\) minmax\(0, 0\.43fr\) minmax\(0, 0\.25fr\)/u);
  assert.match(styles, /\.timelineEmpty \{[^}]*padding: var\(--space-3\) var\(--space-4\)/u);
});

test('the UI covers only event sources that already exist in the current contract and fixtures', () => {
  for (const source of [
    'repairs.operational_note',
    'repairs.equipment_correction',
    'repairs.problem_classification',
    'local.technician_assignment',
    'local.workflow',
    'local.location',
  ]) assert.match(repository, new RegExp(source.replace('.', '\\\.'), 'u'));

  for (const source of ['local.reception', 'local.assignment_projection', 'local.status_projection']) {
    assert.match(fixtures, new RegExp(source.replace('.', '\\\.'), 'u'));
  }
  assert.doesNotMatch(timeline, /evidence|evidencia|custody|custodia/iu);
});
