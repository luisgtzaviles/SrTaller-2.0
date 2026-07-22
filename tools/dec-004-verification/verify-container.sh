#!/usr/bin/env bash

set -Eeuo pipefail

readonly TARGET_SHA="056e8695b9b7f1620ecade03081eaf2c824de4e6"
readonly RUN_LABEL="${1:-run-unknown}"
readonly EXPECTED_BUNDLE_SHA256="${2:?expected bundle SHA-256 is required}"
readonly EVIDENCE_DIR="/evidence"
readonly PROJECT_DIR="/workspace/project"
readonly BUNDLE_PATH="/workspace/source.bundle"
readonly BUNDLE_VERIFY_REPOSITORY="/workspace/bundle-verifier.git"
readonly SUMMARY_FILE="${EVIDENCE_DIR}/summary.env"
readonly RUN_LOG="${EVIDENCE_DIR}/run.log"

mkdir --parents "${EVIDENCE_DIR}"
: >"${SUMMARY_FILE}"
: >"${RUN_LOG}"

exec > >(tee -a "${RUN_LOG}") 2>&1

record() {
  printf '%s=%s\n' "$1" "$2" >>"${SUMMARY_FILE}"
}

run_required() {
  local label="$1"
  shift
  printf '\n[command] %s\n' "${label}"
  local started
  started="$(date +%s)"
  set +e
  "$@"
  local code=$?
  set -e
  record "${label}_exit" "${code}"
  record "${label}_seconds" "$(( $(date +%s) - started ))"
  if [[ "${code}" -ne 0 ]]; then
    printf '[failed] %s exit=%s\n' "${label}" "${code}"
    return "${code}"
  fi
}

expect_failure() {
  local label="$1"
  local output_file="$2"
  shift 2
  printf '\n[negative] %s\n' "${label}"
  set +e
  "$@" >"${output_file}" 2>&1
  local code=$?
  set -e
  record "${label}_observed_exit" "${code}"
  if [[ "${code}" -eq 0 ]]; then
    printf '[failed] %s was accepted unexpectedly\n' "${label}"
    return 1
  fi
  printf '[expected-failure] %s exit=%s\n' "${label}" "${code}"
}

cleanup() {
  local code=$?
  trap - EXIT
  record "completed_utc" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  record "overall_exit" "${code}"
  exit "${code}"
}
trap cleanup EXIT

record "run_label" "${RUN_LABEL}"
record "started_utc" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
record "target_sha" "${TARGET_SHA}"
record "git_transport" "bundle"
record "git_network_access" "none"
record "kernel" "$(uname -s)"
record "kernel_release" "$(uname -r)"
record "architecture" "$(uname -m)"
record "debian_version" "$(. /etc/os-release; printf '%s' "${VERSION_ID}")"
record "libc" "$(getconf GNU_LIBC_VERSION)"
record "dpkg_architecture" "$(dpkg --print-architecture)"
record "node" "$(node --version)"
record "corepack" "$(corepack --version)"
record "pnpm" "$(pnpm --version)"
record "stdin_tty" "$([[ -t 0 ]] && echo yes || echo no)"
record "stdout_tty" "$([[ -t 1 ]] && echo yes || echo no)"

printf '[environment] Linux=%s arch=%s libc=%s Debian=%s\n' \
  "$(uname -s)" "$(uname -m)" "$(getconf GNU_LIBC_VERSION)" \
  "$(. /etc/os-release; printf '%s' "${VERSION_ID}")"
printf '[toolchain] node=%s corepack=%s pnpm=%s\n' \
  "$(node --version)" "$(corepack --version)" "$(pnpm --version)"

test "$(uname -s)" = "Linux"
test "$(uname -m)" = "x86_64"
test "$(getconf GNU_LIBC_VERSION)" = "glibc 2.36"
test "$(. /etc/os-release; printf '%s' "${VERSION_ID}")" = "12"
test "$(node --version)" = "v24.18.0"
test "$(corepack --version)" = "0.35.0"
test "$(pnpm --version)" = "11.15.1"

git config --global credential.helper ""
git config --global advice.detachedHead false
test -r "${BUNDLE_PATH}"
readonly ACTUAL_BUNDLE_SHA256="$(sha256sum "${BUNDLE_PATH}" | cut -d' ' -f1)"
record "bundle_expected_sha256" "${EXPECTED_BUNDLE_SHA256}"
record "bundle_actual_sha256" "${ACTUAL_BUNDLE_SHA256}"
test "${ACTUAL_BUNDLE_SHA256}" = "${EXPECTED_BUNDLE_SHA256}"
run_required bundle_verifier_init git init --quiet --bare "${BUNDLE_VERIFY_REPOSITORY}"
run_required bundle_verify git -C "${BUNDLE_VERIFY_REPOSITORY}" \
  bundle verify "${BUNDLE_PATH}"
git -C "${BUNDLE_VERIFY_REPOSITORY}" bundle list-heads "${BUNDLE_PATH}" \
  >"${EVIDENCE_DIR}/bundle-heads.txt"
grep -q "^${TARGET_SHA} refs/heads/dec004-bundle-temp$" \
  "${EVIDENCE_DIR}/bundle-heads.txt"
rm -rf "${BUNDLE_VERIFY_REPOSITORY}"
run_required git_clone git clone --no-checkout "${BUNDLE_PATH}" "${PROJECT_DIR}"
run_required git_checkout git -C "${PROJECT_DIR}" checkout --detach "${TARGET_SHA}"
cd "${PROJECT_DIR}"

git remote remove origin
if git show-ref --verify --quiet refs/heads/dec004-bundle-temp; then
  git branch --delete --force dec004-bundle-temp
fi
if git show-ref | grep -q 'dec004-bundle-temp'; then
  printf '[failed] temporary bundle reference remains after detached checkout\n'
  exit 1
fi
record "temporary_bundle_refs_removed" "yes"

readonly ACTUAL_SHA="$(git rev-parse HEAD)"
record "actual_sha" "${ACTUAL_SHA}"
test "${ACTUAL_SHA}" = "${TARGET_SHA}"
test "$(git branch --show-current)" = ""
test -z "$(git status --short)"
test ! -e node_modules
test ! -e dist
record "initial_git_clean" "yes"
record "initial_node_modules_absent" "yes"
record "initial_dist_absent" "yes"

find . -maxdepth 1 -type f \
  \( -name 'package-lock.json' -o -name 'npm-shrinkwrap.json' \
     -o -name 'yarn.lock' -o -name 'bun.lock' -o -name 'bun.lockb' \
     -o -name 'pnpm-lock.yaml' \) \
  -printf '%f\n' | LC_ALL=C sort >"${EVIDENCE_DIR}/root-lockfiles.txt"
test "$(wc -l <"${EVIDENCE_DIR}/root-lockfiles.txt" | tr -d ' ')" = "1"
test "$(cat "${EVIDENCE_DIR}/root-lockfiles.txt")" = "pnpm-lock.yaml"
record "root_lockfiles" "1"
record "root_workspace_files" "$([[ -e pnpm-workspace.yaml ]] && echo 1 || echo 0)"
test ! -e pnpm-workspace.yaml

{
  printf '%s\0' .node-version .npmrc .nvmrc package.json pnpm-lock.yaml \
    supply-chain-policy.json tsconfig.json tsconfig.build.json
  find scripts src test -type f -print0 | LC_ALL=C sort -z
} | xargs -0 sha256sum | sed 's#  \./#  #' \
  >"${EVIDENCE_DIR}/technical-inputs.sha256"

run_required install_frozen pnpm install --frozen-lockfile
record "typescript" "$(pnpm exec tsc --version | awk '{print $2}')"
record "nestjs_common" "$(node -e "console.log(require('./node_modules/@nestjs/common/package.json').version)")"
record "nestjs_core" "$(node -e "console.log(require('./node_modules/@nestjs/core/package.json').version)")"
record "nestjs_platform_express" "$(node -e "console.log(require('./node_modules/@nestjs/platform-express/package.json').version)")"
test -z "$(git status --short)"
record "post_install_git_clean" "yes"

test ! -e dist
run_required typecheck pnpm run typecheck
test ! -e dist
record "typecheck_zero_emit" "yes"
run_required build pnpm run build
test -f dist/main.js
run_required test pnpm test
run_required verify pnpm run verify
run_required smoke_start pnpm run smoke:start

if command -v tsc >/dev/null 2>&1; then
  record "implicit_global_tsc" "present"
  exit 1
else
  record "implicit_global_tsc" "absent"
fi
run_required controlled_path env \
  PATH="/opt/node/bin:/usr/local/bin:/usr/bin:/bin" \
  pnpm run verify
record "local_tsc" "$(pnpm exec sh -c 'command -v tsc' | sed "s#${PROJECT_DIR}/##")"

expect_failure node_incompatible \
  "${EVIDENCE_DIR}/negative-node.log" \
  env npm_config_user_agent='pnpm/11.15.1 npm/? node/v24.18.0 linux x64' \
  node --input-type=module --eval \
  "import { validateRuntimeFacts } from './scripts/lib/toolchain-contract.mjs'; const failures = validateRuntimeFacts({nodeVersion:'25.9.0', packageManagerVersion:'11.15.1'}); console.error(failures.join('\\n')); process.exit(failures.length === 1 ? 25 : 0);"

expect_failure package_manager_incompatible \
  "${EVIDENCE_DIR}/negative-package-manager.log" \
  env npm_config_user_agent='npm/11.0.0 node/v24.18.0 linux x64' \
  node scripts/verify-toolchain.mjs

expect_failure pnpm_incompatible \
  "${EVIDENCE_DIR}/negative-pnpm.log" \
  env npm_config_user_agent='pnpm/11.15.0 npm/? node/v24.18.0 linux x64' \
  node scripts/verify-toolchain.mjs

printf '\n[command] diagnostics\n'
set +e
pnpm run diagnose:local \
  | tee "${EVIDENCE_DIR}/diagnostics-output.log"
diagnostics_exit=${PIPESTATUS[0]}
set -e
record "diagnostics_exit" "${diagnostics_exit}"
test "${diagnostics_exit}" -eq 0
awk 'started || /^\{$/ { started = 1; print }' \
  "${EVIDENCE_DIR}/diagnostics-output.log" \
  >"${EVIDENCE_DIR}/diagnostics.json"
node --eval \
  "JSON.parse(require('node:fs').readFileSync('${EVIDENCE_DIR}/diagnostics.json', 'utf8'))"

set +e
env -u NODE_ENV HOST=127.0.0.1 PORT=32123 \
  node --enable-source-maps dist/main.js \
  >"${EVIDENCE_DIR}/source-map-negative.log" 2>&1
source_map_exit=$?
set -e
record "source_map_negative_exit" "${source_map_exit}"
test "${source_map_exit}" -ne 0
grep -q 'src/startup-config.ts' "${EVIDENCE_DIR}/source-map-negative.log"
if grep -R -q 'sourcesContent' dist/*.map; then
  record "source_maps_inline_sources" "yes"
  exit 1
else
  record "source_maps_inline_sources" "no"
fi

: >"${EVIDENCE_DIR}/variables-negative.log"
check_invalid_startup() {
  local label="$1"
  shift
  set +e
  "$@" >>"${EVIDENCE_DIR}/variables-negative.log" 2>&1
  local code=$?
  set -e
  record "variable_${label}_exit" "${code}"
  test "${code}" -ne 0
}

check_invalid_startup missing_host \
  env -u HOST NODE_ENV=production PORT=32125 \
  node --enable-source-maps dist/main.js
check_invalid_startup missing_node_env \
  env -u NODE_ENV HOST=127.0.0.1 PORT=32125 \
  node --enable-source-maps dist/main.js
check_invalid_startup missing_port \
  env -u PORT HOST=127.0.0.1 NODE_ENV=production \
  node --enable-source-maps dist/main.js
check_invalid_startup invalid_node_env \
  env HOST=127.0.0.1 NODE_ENV=invalid PORT=32125 \
  node --enable-source-maps dist/main.js
check_invalid_startup invalid_port \
  env HOST=127.0.0.1 NODE_ENV=production PORT=invalid \
  node --enable-source-maps dist/main.js
record "variable_negative_cases" "5"
record "variable_negative_cases_rejected" "yes"

set +e
NODE_ENV=development HOST=127.0.0.1 PORT=32124 \
  setsid pnpm run dev >"${EVIDENCE_DIR}/dev.log" 2>&1 &
dev_pid=$!
set -e
dev_ready=no
for _ in $(seq 1 160); do
  if grep -q 'Watching for file changes' "${EVIDENCE_DIR}/dev.log" \
    && grep -q 'technical_shell_listening' "${EVIDENCE_DIR}/dev.log"; then
    dev_ready=yes
    break
  fi
  if ! kill -0 "${dev_pid}" 2>/dev/null; then
    break
  fi
  sleep 0.1
done
record "dev_watch_ready" "${dev_ready}"
kill -INT -- "-${dev_pid}" 2>/dev/null || true
set +e
wait "${dev_pid}"
dev_exit=$?
set -e
record "dev_watch_exit" "${dev_exit}"
test "${dev_ready}" = "yes"

find dist -type f -printf '%P\t%s\t%m\n' \
  | LC_ALL=C sort >"${EVIDENCE_DIR}/inventory"
while IFS= read -r relative_path; do
  sha256sum "dist/${relative_path}"
done < <(find dist -type f -printf '%P\n' | LC_ALL=C sort) \
  | sed 's#  dist/#  #' >"${EVIDENCE_DIR}/dist.sha256"

record "dist_file_count" "$(wc -l <"${EVIDENCE_DIR}/inventory" | tr -d ' ')"
record "dist_total_bytes" "$(awk -F '\t' '{sum += $2} END {print sum + 0}' "${EVIDENCE_DIR}/inventory")"
record "workspace_path_references" "$( (grep -R -I -l '/workspace/' dist || true) | wc -l | tr -d ' ')"
record "home_path_references" "$( (grep -R -I -l '/home/' dist || true) | wc -l | tr -d ' ')"
record "env_files_read" "0"
record "git_credentials_used" "none"

test -z "$(git status --short)"
record "final_git_clean" "yes"
record "final_sha" "$(git rev-parse HEAD)"

printf '\n[result] %s completed successfully\n' "${RUN_LABEL}"
