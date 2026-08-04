# systemd results

- Service: active and enabled.
- Effective exposure score: 2.3 (`OK`) from `systemd-analyze security`.
- User/group: `srtaller-file-explorer` only.
- Capabilities: empty bounding and ambient sets.
- Filesystem: `ProtectSystem=strict`; only private state is writable.
- Limits: `MemoryMax=160M`, `CPUQuota=25%`, `TasksMax=64`.
- Timeouts: start 30 seconds, stop 15 seconds.

Exception: `MemoryDenyWriteExecute=true` caused repeatable `SIGSEGV` before the
listener opened and was removed as explicitly allowed when incompatible. All
other declared isolation controls remain active.
