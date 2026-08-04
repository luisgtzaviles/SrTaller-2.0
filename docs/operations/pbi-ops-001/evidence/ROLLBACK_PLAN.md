# Rollback plan

The repository `remove.sh` stops/disables the unit, removes its binary,
configuration, state, curated root and dedicated user, then reloads systemd.
The operator separately removes only the `files.srtaller.dev` Caddy block and
`SR_FILES_*` environment entries, validates Caddy and reloads it.

Dry validation completed through shell syntax checks, exact path review and
Caddy validation. Destructive uninstall was not run because deployment passed.
After removal, verify preview frontend/context and the public listener set.
