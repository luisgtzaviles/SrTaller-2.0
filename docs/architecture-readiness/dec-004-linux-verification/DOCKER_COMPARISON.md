# DEC-004 — Docker preliminary build comparison

## Result

`PASS — IDENTICAL PRELIMINARY BUILDS`

The two emulated `linux/amd64` containers used distinct bundle files,
filesystems, homes, pnpm stores, clones, dependency trees and build outputs.

| Comparison | Result |
| --- | --- |
| Target SHA | MATCH |
| Bundle SHA-256 | MATCH |
| Technical input manifest | MATCH |
| File count | MATCH: 8 |
| Relative paths | MATCH |
| File sizes | MATCH: 5,600 bytes total |
| File modes | MATCH: all `644` |
| Content SHA-256 | MATCH for all 8 files |
| JavaScript | MATCH |
| Source maps | MATCH |
| Embedded workspace paths | MATCH: zero |
| Embedded home paths | MATCH: zero |
| Inline source content | MATCH: absent |
| Container exit | MATCH: `0` |

The external timestamps differ, as expected for independent sequential runs:
run 1 executed from `21:28:23Z` to `21:30:56Z`; run 2 executed from
`21:30:56Z` to `21:33:23Z`. Because every emitted content hash is identical,
those timestamps were not embedded in the build output.

No artifact was changed, normalized or post-processed to force equality. There
are no build differences to report.

Canonical evidence:

- [Run 1 inventory](docker-run-1.inventory)
- [Run 2 inventory](docker-run-2.inventory)
- [Run 1 SHA-256](docker-run-1.sha256)
- [Run 2 SHA-256](docker-run-2.sha256)
- [Machine comparison](generated/comparison.txt)
