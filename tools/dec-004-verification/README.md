# DEC-004 preliminary Docker verification

This directory contains the minimal, local-only infrastructure for producing
**Preliminary emulated Linux amd64/glibc evidence** for DEC-004. It does not
provide native Linux `x86_64` ratification, CI, deployment or a product image.

## Safety boundaries

- The build context contains only the Dockerfile and container runner.
- The host working tree is not copied or mounted.
- Every container receives a distinct, read-only copy of the canonical Git
  bundle, verifies it, clones it independently and checks out the exact detached
  commit `056e8695b9b7f1620ecade03081eaf2c824de4e6`.
- No ports, volumes, host networking, privileged mode or Docker socket are used.
- No `.env`, business data, credentials or secrets are provided. The bundle is
  the only host file mounted and the working tree is never mounted.
- The scripts remove only the specifically named verification containers; they
  never invoke a global Docker prune.

## Pinned environment

- Debian 12 Bookworm slim:
  `sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818`
- Platform: `linux/amd64`
- GNU glibc `2.36`
- Node.js `24.18.0`, verified against its official SHA-256 manifest
- Corepack `0.35.0`, archive integrity checked before installation
- pnpm `11.15.1`

## Reproduction

From the repository root:

```sh
tools/dec-004-verification/build-image.sh
tools/dec-004-verification/run-two.sh \
  srtaller-dec004-preliminary:056e8695 \
  /tmp/srtaller-dec004-bundle
```

The second command writes generated evidence below
`docs/architecture-readiness/dec-004-linux-verification/generated/`, compares
both inventories and content hashes, then deletes its two containers.

The private remote is not accessed from a container. The authorized transport
is a canonical Git bundle generated from the exact committed SHA, copied twice
and mounted once per container as `/workspace/source.bundle` in read-only mode.
The scripts do not read the host credential store, SSH agent, GitHub CLI token
or macOS keychain and expose no token flag.

The image is retained only to make the preliminary trial repeatable and can be
removed by its exact tag when no longer needed:

```sh
docker image rm srtaller-dec004-preliminary:056e8695
```

Removing the image is optional and must not be replaced with global cleanup.
