#!/usr/bin/env bash
set -euo pipefail

BOOTSTRAP_VERSION="ubuntu-24.04-x86_64-v1"
NODE_VERSION="24.18.0"
NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
NODE_SHA256="55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742"
PNPM_VERSION="11.15.1"

repo="${1:?repository URL is required}"
tested_sha="${2:?tested SHA is required}"
leg="${3:?leg is required}"

test "$(uname -s)" = "Linux"
test "$(uname -m)" = "x86_64"
. /etc/os-release
test "${ID}" = "ubuntu"
test "${VERSION_ID}" = "24.04"
test "${leg}" = "run-1" || test "${leg}" = "run-2"
[[ "${tested_sha}" =~ ^[0-9a-f]{40}$ ]]

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl git openssh-client xz-utils docker.io
systemctl enable --now docker

node_archive="/tmp/${NODE_ARCHIVE}"
curl --fail --silent --show-error --location \
  "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}" \
  --output "${node_archive}"
printf '%s  %s\n' "${NODE_SHA256}" "${node_archive}" | sha256sum --check --status
tar --extract --xz --file "${node_archive}" --directory /usr/local --strip-components=1
rm -f "${node_archive}"
corepack enable
corepack prepare "pnpm@${PNPM_VERSION}" --activate
test "$(node --version)" = "v${NODE_VERSION}"
test "$(pnpm --version)" = "${PNPM_VERSION}"

install -d -m 0700 /opt/srtaller-source /opt/srtaller-evidence /opt/srtaller-pnpm
export COREPACK_HOME=/opt/srtaller-pnpm/corepack
export PNPM_HOME=/opt/srtaller-pnpm/home
export XDG_CACHE_HOME=/opt/srtaller-pnpm/cache
export PATH="${PNPM_HOME}:${PATH}"

git clone --quiet --no-tags "${repo}" /opt/srtaller-source/repository
cd /opt/srtaller-source/repository
git fetch --quiet --no-tags origin "${tested_sha}"
git checkout --quiet --detach "${tested_sha}"
test "$(git rev-parse HEAD)" = "${tested_sha}"
test -z "$(git status --porcelain=v1 --untracked-files=all)"

pnpm install --frozen-lockfile

verification_exit=0
set +e
SR_FULL_VERIFICATION_EVIDENCE_DIR=/opt/srtaller-evidence \
  ./scripts/pnpm-governed run verify:full 2>&1 | \
  tee /opt/srtaller-evidence/FULL_VERIFICATION_OUTPUT.log
verification_exit="${PIPESTATUS[0]}"
set -e

node /opt/srtaller-control/ci/collect-tier2-runner-evidence.mjs \
  --output /opt/srtaller-evidence/TIER2_RUNNER_EVIDENCE.json \
  --full /opt/srtaller-evidence/FULL_VERIFICATION_SUMMARY.json \
  --verification-log /opt/srtaller-evidence/FULL_VERIFICATION_OUTPUT.log \
  --tested-sha "${tested_sha}" \
  --leg "${leg}" \
  --verification-exit-code "${verification_exit}"
rm -f /opt/srtaller-evidence/FULL_VERIFICATION_OUTPUT.log

test "${verification_exit}" -eq 0
test "${BOOTSTRAP_VERSION}" = "ubuntu-24.04-x86_64-v1"
