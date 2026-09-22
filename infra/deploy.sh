#!/usr/bin/env bash
# Deploy the Hisab Firebase backend (Firestore rules + indexes + Cloud Functions).
#
# Usage:
#   ./deploy.sh <project-id>            # deploy everything (rules, indexes, functions)
#   ./deploy.sh <project-id> --only firestore
#   ./deploy.sh <project-id> --only functions
#
# Prerequisites:
#   - `firebase` CLI installed and logged in (`firebase login`)
#   - `google-services.json` / `GoogleService-Info.plist` are NOT needed for this step
#   - Node 22 (functions target Node 22)
#
# What it does:
#   1. Installs + typechecks + builds apps/functions (tsc -> lib/)
#   2. Runs the functions unit tests (20 tests)
#   3. Deploys from infra/ so firebase.json resolves rules, indexes, and
#      the functions source at ../apps/functions
set -euo pipefail

PROJECT="${1:-}"
ONLY="firestore,functions"

if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <firebase-project-id> [--only firestore|functions]" >&2
  exit 1
fi
if [[ "${2:-}" == "--only" && -n "${3:-}" ]]; then
  ONLY="$3"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FUNCTIONS_DIR="$REPO_ROOT/apps/functions"

command -v firebase >/dev/null 2>&1 || { echo "error: firebase CLI not found (npm i -g firebase-tools)" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "error: node not found" >&2; exit 1; }

echo "==> Building Cloud Functions (Node $(node -v))"
cd "$FUNCTIONS_DIR"
if [[ ! -d node_modules ]]; then
  echo "    npm ci ..."
  npm ci --no-audit --no-fund
fi
echo "    tsc ..."
npm run build
echo "    jest ..."
npm test --silent

echo "==> Deploying [$ONLY] to project [$PROJECT]"
cd "$SCRIPT_DIR"
firebase deploy --project "$PROJECT" --only "$ONLY" --non-interactive

echo "==> Done. Verify in the Firebase console: Firestore rules timestamp + Functions list."
