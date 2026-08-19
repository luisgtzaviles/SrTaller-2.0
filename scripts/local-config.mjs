import { ensureLocalEnvironment } from './lib/local-development.mjs';

const values = await ensureLocalEnvironment();
process.stdout.write(`${JSON.stringify({
  event: 'local_configuration_ready',
  file: '.env.local',
  environment: values.SR_LOCAL_ENVIRONMENT,
  databaseHost: values.SR_LOCAL_DB_HOST,
  databasePort: Number(values.SR_LOCAL_DB_PORT),
  databaseName: values.SR_LOCAL_DB_NAME,
  backendPort: Number(values.SR_LOCAL_BACKEND_PORT),
  vitePort: Number(values.SR_LOCAL_VITE_PORT),
  credentials: 'generated local-only values; not printed',
})}\n`);
