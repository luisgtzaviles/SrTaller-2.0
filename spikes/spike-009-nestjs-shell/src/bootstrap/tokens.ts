export const TOKENS = {
  authority: Symbol('FixtureAuthority'),
  pool: Symbol('PostgresPool'),
  readiness: Symbol('ReadinessProbe'),
  authorization: Symbol('SyntheticAuthorizationPolicy'),
  unitOfWork: Symbol('UnitOfWork'),
  audit: Symbol('AuditPort'),
  operation: Symbol('ExecuteSyntheticOperation'),
  jobs: Symbol('DeferredJobRunner'),
  telemetry: Symbol('TechnicalTelemetry'),
  logger: Symbol('OperationalLogger'),
} as const;
