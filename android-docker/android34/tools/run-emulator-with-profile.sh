#!/usr/bin/env bash
set -euo pipefail

PROFILE=${SPOOF_PROFILE:-pixel_8_pro}
PROP_FILE="/opt/spoof/profiles/${PROFILE}.props"

if [ ! -f "$PROP_FILE" ]; then
  echo "profile not found: $PROFILE ($PROP_FILE)" >&2
  exit 1
fi

AVD_NAME=${AVD_NAME:-emu_${PROFILE}_api34}
SYS_IMG="system-images;android-34;google_apis;x86_64"

source /opt/android-sdk-linux/bin/android-env.sh

# Create AVD if not exists
if ! avdmanager list avd | grep -q "name: $AVD_NAME"; then
  echo "Creating AVD $AVD_NAME"
  echo "no" | avdmanager create avd -n "$AVD_NAME" -k "$SYS_IMG" -f || true
fi

# Build -prop arguments
PROP_ARGS=()
while IFS='=' read -r k v; do
  [ -z "$k" ] && continue
  PROP_ARGS+=( -prop "${k}=${v}" )
done < "$PROP_FILE"

EMULATOR_BIN="${ANDROID_HOME}/emulator/emulator"
ARGS=( -avd "$AVD_NAME" -gpu swiftshader_indirect -no-accel -no-snapshot -no-boot-anim -verbose )

exec "$EMULATOR_BIN" "${ARGS[@]}" "${PROP_ARGS[@]}"

