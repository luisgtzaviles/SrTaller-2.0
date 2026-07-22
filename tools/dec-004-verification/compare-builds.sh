#!/usr/bin/env bash

set -Eeuo pipefail

readonly OUTPUT_DIRECTORY="${1:?usage: compare-builds.sh OUTPUT_DIRECTORY}"
readonly RUN_1="${OUTPUT_DIRECTORY}/run-1"
readonly RUN_2="${OUTPUT_DIRECTORY}/run-2"
readonly REPORT="${OUTPUT_DIRECTORY}/comparison.txt"

: >"${REPORT}"

compare() {
  local label="$1"
  local file="$2"
  if cmp --silent "${RUN_1}/${file}" "${RUN_2}/${file}"; then
    printf '%s=MATCH\n' "${label}" | tee -a "${REPORT}"
  else
    printf '%s=DIFFERENT\n' "${label}" | tee -a "${REPORT}"
    diff --unified "${RUN_1}/${file}" "${RUN_2}/${file}" \
      >"${OUTPUT_DIRECTORY}/${label}.diff" || true
    return 1
  fi
}

compare inventory inventory
compare dist_sha256 dist.sha256
compare technical_inputs technical-inputs.sha256

printf 'run_1_exit=%s\n' "$(cat "${RUN_1}/container.exit")" \
  | tee -a "${REPORT}"
printf 'run_2_exit=%s\n' "$(cat "${RUN_2}/container.exit")" \
  | tee -a "${REPORT}"
