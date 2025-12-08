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
TOOLS_DIR=${TOOLS_DIR:-/opt/tools}

AVD_NAME="emu_${PROFILE}_api${API}_d${DID}"
SYS_IMG="system-images;android-${API};google_apis;x86_64"

export DISPLAY
export SPOOF_PROFILE="$PROFILE"
export API="$API"
export AVD_NAME
export SYS_IMG

resolve_android_docker_dir() {
  for d in "${ANDROID_DOCKER_DIR:-}" "/opt/android-docker" "/opt/app/android-docker" "$(pwd)/android-docker"; do
    [ -n "$d" ] && [ -d "$d" ] && echo "$d" && return 0
  done
  echo ""
}

ANDROID_DOCKER_DIR="$(resolve_android_docker_dir)"
if [ -n "$ANDROID_DOCKER_DIR" ]; then
  VERSION_DIR="${ANDROID_DOCKER_DIR}/android${API}"
  if [ -d "${VERSION_DIR}/tools" ]; then
    mkdir -p "$TOOLS_DIR"
    cp -a "${VERSION_DIR}/tools/." "$TOOLS_DIR/"
  fi
  if [ -d "${VERSION_DIR}/licenses" ]; then
    mkdir -p /opt/licenses
    cp -a "${VERSION_DIR}/licenses/." /opt/licenses/
  fi
  find "$TOOLS_DIR" -type f -name "*.sh" -exec chmod +x {} \; >/dev/null 2>&1 || true
  chmod -R 0755 "$TOOLS_DIR" "/opt/licenses" >/dev/null 2>&1 || true
  mkdir -p "/opt/android-sdk-linux/bin"
  if [ -f "$TOOLS_DIR/android-env.sh" ]; then
    cp -f "$TOOLS_DIR/android-env.sh" "/opt/android-sdk-linux/bin/android-env.sh"
  fi
fi

if [ -f "/opt/android-sdk-linux/bin/android-env.sh" ]; then
  source "/opt/android-sdk-linux/bin/android-env.sh"
fi

if [ -d "$TOOLS_DIR" ]; then
  find "$TOOLS_DIR" -type f -name "*.sh" -exec chmod +x {} \; >/dev/null 2>&1 || true
fi

LOG_DIR="/var/log/emuhub/d${DID}"
mkdir -p "$LOG_DIR"
LOCK_FILE="/tmp/emu_session_${DID}.lock"
if [ -f "$LOCK_FILE" ]; then
  echo "Session ${DID} already initialized (lock present): $LOCK_FILE" | tee -a "${LOG_DIR}/session.log"
else
  echo $$ > "$LOCK_FILE"
fi

SYS_DIR="/opt/android-sdk-linux/system-images/android-${API}/google_apis/x86_64"
SDK_BIN="/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager"
if [ ! -d "$SYS_DIR" ]; then
  if [ -x "${TOOLS_DIR}/android-accept-licenses.sh" ]; then
    "${TOOLS_DIR}/android-accept-licenses.sh" "sdkmanager ${SYS_IMG}" || true
  else
    "$SDK_BIN" "${SYS_IMG}" || true
  fi
fi

if ! pgrep -f "Xvfb .*${DISPLAY}" >/dev/null 2>&1; then
  nohup Xvfb "$DISPLAY" -screen 0 "$EMU_RES" >"${LOG_DIR}/xvfb.log" 2>&1 &
fi

PASSWD_FILE="/tmp/vnc_pass_${DID}"
bash -lc "x11vnc -storepasswd \"${VNC_PASS}\" ${PASSWD_FILE}" >/dev/null 2>&1 || true

choose_free_port() {
  local base=$1
  local limit=${2:-200}
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

if ! pgrep -f "emulator.*-avd ${AVD_NAME}" >/dev/null 2>&1; then
  nohup "${TOOLS_DIR}/run-emulator-with-profile.sh" >"${LOG_DIR}/emulator.log" 2>&1 &
fi

if [ "$WAIT_READY" = "true" ]; then
  nohup "${TOOLS_DIR}/android-wait-for-emulator.sh" >"${LOG_DIR}/emulator_ready.log" 2>&1 &
fi

echo "{\"did\":${DID},\"display\":\"${DISPLAY}\",\"vnc\":${VNC_PORT},\"ws\":${WS_PORT},\"profile\":\"${PROFILE}\",\"api\":${API}}"
