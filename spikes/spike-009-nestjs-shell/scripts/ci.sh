#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

case "$(node --version)" in
  v24.18.*) ;;
  *) printf '%s\n' 'SPIKE-009 CI requires Node.js 24.18.x.' >&2; exit 1 ;;
esac

case "$(npm --version)" in
  11.16.*) ;;
  *) printf '%s\n' 'SPIKE-009 CI requires npm 11.16.x.' >&2; exit 1 ;;
esac

npm ci
npm run verify
npm audit --audit-level=low
npm audit signatures
