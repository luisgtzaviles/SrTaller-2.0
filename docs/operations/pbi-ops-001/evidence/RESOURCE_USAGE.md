# Resource usage

Post-install snapshot:

- VPS memory: 3.7 GiB total, approximately 726 MiB used, 3.0 GiB available.
- Explorer RSS: approximately 80 MiB; seven tasks; under 1% sampled CPU.
- Root filesystem: 38 GiB total, 3.0 GiB used (9%).
- Enforced explorer maximums: 160 MiB memory, 25% of one CPU, 64 tasks.
- Caddy, preview, PostgreSQL and SSH remained active.

The pre-install audit confirmed the explorer process/listener did not exist.
The isolated process therefore accounts for approximately the reported 80 MiB
increment; filesystem growth remained below the displayed `df` precision.
