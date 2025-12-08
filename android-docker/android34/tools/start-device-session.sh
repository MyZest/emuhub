#!/usr/bin/env bash
set -euo pipefail

# Args: DID DISPLAY VNC_PORT WS_PORT VNC_PASS PROFILE API
DID=${1:-0}
DISPLAY=${2:-":11"}
VNC_PORT=${3:-5901}
WS_PORT=${4:-6081}
VNC_PASS=${5:-admin}
PROFILE=${6:-pixel_8_pro}
API=${7:-34}
EMU_RES=${EMU_RES:-1280x800x24}
WAIT_READY=${WAIT_READY:-false}

AVD_NAME="emu_${PROFILE}_api${API}_d${DID}"
SYS_IMG="system-images;android-${API};google_apis;x86_64"

export DISPLAY
export SPOOF_PROFILE="$PROFILE"
export API="$API"
export AVD_NAME
export SYS_IMG

# Ensure Android env in PATH if available
if [ -f "/opt/android-sdk-linux/bin/android-env.sh" ]; then
  source "/opt/android-sdk-linux/bin/android-env.sh"
fi

# Logs directory per session
LOG_DIR="/var/log/emuhub/d${DID}"
mkdir -p "$LOG_DIR"
LOCK_FILE="/tmp/emu_session_${DID}.lock"
if [ -f "$LOCK_FILE" ]; then
  echo "Session ${DID} already initialized (lock present): $LOCK_FILE" | tee -a "${LOG_DIR}/session.log"
else
  echo $$ > "$LOCK_FILE"
fi

# Ensure required system image only if missing
SYS_DIR="/opt/android-sdk-linux/system-images/android-${API}/google_apis/x86_64"
SDK_BIN="/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager"
if [ ! -d "$SYS_DIR" ]; then
  if command -v android-accept-licenses.sh >/dev/null 2>&1; then
    android-accept-licenses.sh "sdkmanager ${SYS_IMG}" || true
  else
    "$SDK_BIN" "${SYS_IMG}" || true
  fi
fi

# Start Xvfb (idempotent)
if ! pgrep -f "Xvfb .*${DISPLAY}" >/dev/null 2>&1; then
  nohup Xvfb "$DISPLAY" -screen 0 "$EMU_RES" >"${LOG_DIR}/xvfb.log" 2>&1 &
fi

# VNC password file
PASSWD_FILE="/tmp/vnc_pass_${DID}"
bash -lc "x11vnc -storepasswd \"${VNC_PASS}\" ${PASSWD_FILE}" >/dev/null 2>&1 || true

choose_free_port() {
  local base=$1
  local limit=${2:-100}
  local p=$base
  local i=0
  while [ $i -lt $limit ]; do
    if ss -lnt | awk '{print $4}' | grep -q ":${p}$"; then
      p=$((p+1)); i=$((i+1));
    else
      echo "$p"; return 0
    fi
  done
  echo "$base"
}

if ss -lnt | awk '{print $4}' | grep -q ":${VNC_PORT}$"; then
  NEW_VNC_PORT=$(choose_free_port "$VNC_PORT" 200)
  echo "VNC port ${VNC_PORT} in use, picked ${NEW_VNC_PORT}" | tee -a "${LOG_DIR}/session.log"
  VNC_PORT=$NEW_VNC_PORT
fi
if ! pgrep -f "x11vnc .*rfbport ${VNC_PORT}" >/dev/null 2>&1; then
  nohup x11vnc -display "$DISPLAY" -forever -rfbport "$VNC_PORT" -shared -passwdfile "$PASSWD_FILE" >"${LOG_DIR}/x11vnc.log" 2>&1 &
fi

if ss -lnt | awk '{print $4}' | grep -q ":${WS_PORT}$"; then
  NEW_WS_PORT=$(choose_free_port "$WS_PORT" 200)
  echo "WS port ${WS_PORT} in use, picked ${NEW_WS_PORT}" | tee -a "${LOG_DIR}/session.log"
  WS_PORT=$NEW_WS_PORT
fi
if ! pgrep -f "websockify .* ${WS_PORT} .*${VNC_PORT}" >/dev/null 2>&1; then
  nohup websockify "$WS_PORT" "localhost:${VNC_PORT}" >"${LOG_DIR}/websockify.log" 2>&1 &
fi

# Start emulator with profile (background, idempotent best-effort)
if ! pgrep -f "emulator.*-avd ${AVD_NAME}" >/dev/null 2>&1; then
  nohup /opt/tools/run-emulator-with-profile.sh >"${LOG_DIR}/emulator.log" 2>&1 &
fi

# Optional readiness check in background
if [ "$WAIT_READY" = "true" ]; then
  nohup /opt/tools/android-wait-for-emulator.sh >"${LOG_DIR}/emulator_ready.log" 2>&1 &
fi

echo "{\"did\":${DID},\"display\":\"${DISPLAY}\",\"vnc\":${VNC_PORT},\"ws\":${WS_PORT},\"profile\":\"${PROFILE}\",\"api\":${API}}"
