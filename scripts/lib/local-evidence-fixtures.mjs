import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const LOCAL_EVIDENCE_ROOT = resolve(process.cwd(), '.runtime/repair-evidence');
const WIDTH = 640;
const HEIGHT = 420;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return output;
}

function syntheticPng(seed) {
  const palette = [
    [37, 99, 235], [8, 145, 178], [124, 58, 237],
    [22, 163, 74], [217, 119, 6], [220, 38, 38], [71, 85, 105],
  ];
  const accent = palette[seed % palette.length];
  const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const row = y * (WIDTH * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = row + 1 + x * 3;
      const phone = x >= 205 && x <= 435 && y >= 42 && y <= 378;
      const screen = x >= 221 && x <= 419 && y >= 72 && y <= 340;
      const port = seed === 3 && x >= 292 && x <= 348 && y >= 340 && y <= 359;
      const detail = seed === 4 && x >= 230 && x <= 410 && y >= 112 && y <= 146;
      const color = port || detail
        ? accent
        : screen
          ? [31 + seed * 3, 41 + seed * 2, 55 + seed]
          : phone
            ? [74, 85, 104]
            : [235 - seed * 2, 241 - seed, 248];
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const definitions = Object.freeze([
  ['00000000-0000-4000-8000-000000003001', 0],
  ['00000000-0000-4000-8000-000000003002', 1],
  ['00000000-0000-4000-8000-000000003003', 2],
  ['00000000-0000-4000-8000-000000003004', 3],
  ['00000000-0000-4000-8000-000000003005', 4],
  ['00000000-0000-4000-8000-000000003006', 5],
]);

export const LOCAL_EVIDENCE_FIXTURES = Object.freeze(definitions.map(([id, seed]) => {
  const content = syntheticPng(seed);
  return Object.freeze({ id, storageKey: `${id}.png`, width: WIDTH, height: HEIGHT, sizeBytes: content.length, content });
}));

export async function materializeLocalEvidenceFixtures(root = LOCAL_EVIDENCE_ROOT) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  for (const fixture of LOCAL_EVIDENCE_FIXTURES) {
    await writeFile(resolve(root, fixture.storageKey), fixture.content, { mode: 0o600 });
  }
  return LOCAL_EVIDENCE_FIXTURES;
}
