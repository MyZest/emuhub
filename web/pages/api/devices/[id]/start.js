import { spawn, spawnSync } from 'child_process'

function sysImg(api) {
  return `system-images;android-${api};google_apis;x86_64`;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const did = parseInt(String(id), 10);
  const body = req.body || {}
  const api = parseInt(String(body?.api ?? 34), 10);
  const allowedApis = [30,32,34];
  if (!allowedApis.includes(api)) return res.status(400).json({ ok:false, error:'invalid api' });
  const profile = String(body?.profile ?? process.env.SPOOF_PROFILE ?? 'pixel_8_pro');
  if (!/^[a-zA-Z0-9_\-]+$/.test(profile)) return res.status(400).json({ ok:false, error:'invalid profile' });
  const vncPass = String(body?.vnc_pass ?? 'admin');
  if (vncPass.length < 1 || vncPass.length > 64) return res.status(400).json({ ok:false, error:'invalid vnc_pass length' });

  const display = `:${10 + did}`;
  const vncPort = 5900 + did;
  const wsPort = 6080 + did;

  // execa tagged template for clearer commands
  const { $ } = await import('execa')
  const $$ = $({ stdio: 'inherit', shell: true })
  const bg = $({ stdio: 'inherit', shell: true, detached: true })

  // ensure system image (foreground)
  await $$`/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager ${sysImg(api)}`

  const env = { ...process.env, DISPLAY: display, SPOOF_PROFILE: profile, API: String(api), AVD_NAME: `emu_${profile}_api${api}_d${did}`, SYS_IMG: sysImg(api) };

  // Xvfb (background)
  bg`Xvfb ${display} -screen 0 1280x800x24`
  // VNC password (foreground)
  const passwdFile = `/tmp/vnc_pass_${did}`;
  await $$`bash -lc 'x11vnc -storepasswd "${vncPass}" ${passwdFile}'`
  // x11vnc (background)
  bg`x11vnc -display ${display} -forever -rfbport ${String(vncPort)} -shared -passwdfile ${passwdFile}`
  // websockify (background)
  bg`websockify ${String(wsPort)} localhost:${vncPort}`
  // emulator (background)
  await $('/opt/tools/run-emulator-with-profile.sh', { env, detached: true })

  res.status(200).json({ ok: true, device: { api, profile, vnc: vncPort, ws: wsPort } });
}
