import { validateExternalConfigurationCandidate } from './lib/external-configuration-contract.mjs';

const result = await validateExternalConfigurationCandidate();
if (result.problems.length > 0) {
  throw new Error(result.problems.join('\n'));
}

process.stdout.write(
  `External configuration boundary verified across ${result.filesInspected} candidate files\n`,
);
