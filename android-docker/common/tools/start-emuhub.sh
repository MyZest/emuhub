#!/usr/bin/env bash
set -euo pipefail

ENV_SCRIPT="/opt/android-sdk-linux/bin/android-env.sh"
if [ ! -f "$ENV_SCRIPT" ] && [ -f "/opt/tools/android-env.sh" ]; then
  ENV_SCRIPT="/opt/tools/android-env.sh"
fi
[ -f "$ENV_SCRIPT" ] && source "$ENV_SCRIPT"

if ! command -v avdmanager >/dev/null 2>&1 || [ ! -x "${ANDROID_HOME:-/opt/android-sdk-linux}/emulator/emulator" ]; then
  if [ -x "/opt/tools/android-sdk-update.sh" ]; then
    /opt/tools/android-sdk-update.sh built-in
    [ -f "/opt/android-sdk-linux/bin/android-env.sh" ] && source "/opt/android-sdk-linux/bin/android-env.sh"
  fi
fi

cd /opt/app && npm run start
