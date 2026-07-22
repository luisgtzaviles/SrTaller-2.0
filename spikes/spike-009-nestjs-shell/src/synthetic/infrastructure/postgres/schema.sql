DROP TABLE IF EXISTS synthetic_audit_events;
DROP TABLE IF EXISTS synthetic_protected_records;
DROP TABLE IF EXISTS synthetic_branches;

CREATE TABLE synthetic_branches (
  tenant_id text NOT NULL,
  branch_id text NOT NULL,
  PRIMARY KEY (tenant_id, branch_id)
);

CREATE TABLE synthetic_protected_records (
  tenant_id text NOT NULL,
  branch_id text NOT NULL,
  record_id text NOT NULL,
  value text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  PRIMARY KEY (tenant_id, record_id),
  CONSTRAINT synthetic_record_branch_fk
    FOREIGN KEY (tenant_id, branch_id)
    REFERENCES synthetic_branches (tenant_id, branch_id)
);

CREATE TABLE synthetic_audit_events (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text NOT NULL,
  tenant_id text NOT NULL,
  branch_id text NOT NULL,
  session_id text NOT NULL,
  correlation_id text NOT NULL,
  operation text NOT NULL,
  resource_id text NOT NULL,
  control text NOT NULL,
  result text NOT NULL CHECK (result IN ('SUCCEEDED', 'DENIED', 'FAILED')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO synthetic_branches (tenant_id, branch_id) VALUES
  ('tenant-a', 'branch-a'),
  ('tenant-a', 'branch-a-other'),
  ('tenant-b', 'branch-b');

INSERT INTO synthetic_protected_records (tenant_id, branch_id, record_id, value, version) VALUES
  ('tenant-a', 'branch-a', 'record-shared', 'tenant-a-initial', 1),
  ('tenant-b', 'branch-b', 'record-shared', 'tenant-b-initial', 1),
  ('tenant-a', 'branch-a', 'record-a-only', 'tenant-a-only', 1);
