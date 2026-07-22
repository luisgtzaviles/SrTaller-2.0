#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly IMAGE_REFERENCE="${1:-srtaller-dec004-preliminary:056e8695}"
readonly BUNDLE_DIRECTORY="${2:?usage: run-two.sh IMAGE_REFERENCE BUNDLE_DIRECTORY [OUTPUT_DIRECTORY]}"
readonly OUTPUT_DIRECTORY="${3:-${REPOSITORY_ROOT}/docs/architecture-readiness/dec-004-linux-verification/generated}"
readonly RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"

containers=()

cleanup() {
  if [[ "${#containers[@]}" -gt 0 ]]; then
    docker rm --force "${containers[@]}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

mkdir -p "${OUTPUT_DIRECTORY}"

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

run_one() {
  local number="$1"
  local bundle="${BUNDLE_DIRECTORY}/run-${number}.bundle"
  local container="dec004-preliminary-${number}-${RUN_ID}"
  local destination="${OUTPUT_DIRECTORY}/run-${number}"
  local bundle_sha256
  test -f "${bundle}"
  bundle_sha256="$(sha256_file "${bundle}")"
  containers+=("${container}")
  rm -rf "${destination}"
  mkdir -p "${destination}"

  docker create \
    --platform linux/amd64 \
    --network bridge \
    --mount "type=bind,src=${bundle},dst=/workspace/source.bundle,readonly" \
    --label 'org.srtaller.purpose=dec-004-preliminary-verification' \
    --name "${container}" \
    "${IMAGE_REFERENCE}" "run-${number}" "${bundle_sha256}" >/dev/null

  set +e
  docker start --attach "${container}"
  local code=$?
  set -e

  docker cp "${container}:/evidence/." "${destination}"
  printf '%s\n' "${code}" >"${destination}/container.exit"

  docker inspect --format \
    'privileged={{.HostConfig.Privileged}} network={{.HostConfig.NetworkMode}} ports={{json .HostConfig.PortBindings}} platform={{.Platform}}{{range .Mounts}} mount={{.Destination}}:rw={{.RW}}:type={{.Type}}{{end}}' \
    "${container}" >"${destination}/container.inspect"

  if [[ "${code}" -ne 0 ]]; then
    printf 'Run %s failed with exit %s\n' "${number}" "${code}" >&2
    return "${code}"
  fi
}

run_one 1
run_one 2

"${SCRIPT_DIR}/compare-builds.sh" "${OUTPUT_DIRECTORY}"
cleanup
trap - EXIT

printf 'Evidence exported to %s\n' "${OUTPUT_DIRECTORY}"
printf 'Temporary verification containers removed\n'
