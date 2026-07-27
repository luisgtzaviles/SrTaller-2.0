import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  runStationMutationCampaign,
} from './lib/station-semantic-mutation-runner.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const report = await runStationMutationCampaign();
const output = argument('--output');
if (output) {
  await writeFile(
    resolve(output),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
process.stdout.write(
  `PBI-024 semantic mutations: ${report.killed}/${report.total} killed\n`,
);
