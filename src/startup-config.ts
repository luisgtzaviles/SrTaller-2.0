export interface StartupConfig {
  readonly host: string;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly port: number;
}

const allowedNodeEnvironments = new Set<StartupConfig['nodeEnv']>([
  'development',
  'production',
  'test',
]);

function requireValue(
  environment: NodeJS.ProcessEnv,
  name: 'HOST' | 'NODE_ENV' | 'PORT',
): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required technical variable: ${name}`);
  }

  return value;
}

export function loadStartupConfig(
  environment: NodeJS.ProcessEnv,
): StartupConfig {
  const host = requireValue(environment, 'HOST');
  const nodeEnv = requireValue(environment, 'NODE_ENV');
  const portText = requireValue(environment, 'PORT');
  const port = Number(portText);

  if (!allowedNodeEnvironments.has(nodeEnv as StartupConfig['nodeEnv'])) {
    throw new Error('NODE_ENV must be development, production or test');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer from 1 through 65535');
  }

  return {
    host,
    nodeEnv: nodeEnv as StartupConfig['nodeEnv'],
    port,
  };
}
