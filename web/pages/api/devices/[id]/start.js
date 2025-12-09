import fs from 'fs'
import path from 'path'

function sysImg(api) {
  return `system-images;android-${api};google_apis;x86_64`
}

export default async function handler(req, res) {
  const did = Date.now()
  const body = req.body || {}
  const api = parseInt(String(body?.api ?? 34), 10)
  function readApisFromAndroidDocker() {
    const baseCandidates = [
      process.env.ANDROID_DOCKER_DIR,
      '/opt/android-docker',
      path.join(process.cwd(), 'android-docker'),
      '/opt/app/android-docker',
    ].filter(Boolean)
    const set = new Set()
    for (const base of baseCandidates) {
      try {
        if (!fs.existsSync(base)) continue
        const entries = fs.readdirSync(base, { withFileTypes: true })
        for (const d of entries) {
          if (!d.isDirectory()) continue
          const m = d.name.match(/^android[-_]?(\d+)$/)
          if (m) set.add(parseInt(m[1], 10))
        }
      } catch {}
    }
    return Array.from(set).sort((a, b) => a - b)
  }
  function readApisFromSystemImages() {
    const base = '/opt/android-sdk-linux/system-images'
    try {
      if (!fs.existsSync(base)) return []
      const entries = fs.readdirSync(base, { withFileTypes: true })
      return entries
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .map((name) => {
          const m = name.match(/^android-(\d+)$/)
          return m ? parseInt(m[1], 10) : null
        })
        .filter((n) => typeof n === 'number')
        .sort((a, b) => a - b)
    } catch {
      return []
    }
  }
  function discoverApis() {
    const set = new Set()
    for (const n of readApisFromAndroidDocker()) set.add(n)
    for (const n of readApisFromSystemImages()) set.add(n)
    const list = Array.from(set).sort((a, b) => a - b)
    return list.length ? list : [30, 32, 34]
  }
  const allowedApis = discoverApis()
  if (!allowedApis.includes(api)) return res.status(400).json({ ok: false, error: 'invalid api' })
  const profile = String(body?.profile ?? process.env.SPOOF_PROFILE ?? 'pixel_8_pro')
  if (!/^[a-zA-Z0-9_\-]+$/.test(profile))
    return res.status(400).json({ ok: false, error: 'invalid profile' })
  const vncPass = String(body?.vnc_pass ?? 'admin')
  if (vncPass.length < 1 || vncPass.length > 64)
    return res.status(400).json({ ok: false, error: 'invalid vnc_pass length' })

  const adbPort = Number(body?.adb_port || 0)
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n))
  }
  let vncPort, wsPort, display, adb
  if (Number.isInteger(adbPort) && adbPort >= 1024 && adbPort <= 65535) {
    vncPort = adbPort + 1
    wsPort = adbPort + 2
    const seed = Math.abs(adbPort) % 1000
    display = `:${10 + seed}`
    adb = adbPort
  } else {
    const seed = did % 1000
    display = `:${10 + seed}`
    vncPort = 5900 + seed
    wsPort = 6080 + seed
    adb = vncPort - 1
  }

  const { Socket } = await import('net')
  async function isPortInUse(port, host = '127.0.0.1', timeout = 300) {
    return await new Promise((resolve) => {
      const s = new Socket()
      let done = false
      const finish = (inUse) => {
        if (done) return
        done = true
        try {
          s.destroy()
        } catch {}
        resolve(inUse)
      }
      s.setTimeout(timeout)
      s.once('connect', () => finish(true))
      s.once('timeout', () => finish(false))
      s.once('error', () => finish(false))
      try {
        s.connect(port, host)
      } catch {
        finish(false)
      }
    })
  }

  // 校验端口占用
  if (await isPortInUse(vncPort)) return res.status(409).json({ ok: false, error: 'port in use', port: 'vnc' })
  if (await isPortInUse(wsPort)) return res.status(409).json({ ok: false, error: 'port in use', port: 'ws' })

  const { spawn } = await import('child_process')
  const args = [
    String(did),
    display,
    String(vncPort),
    String(wsPort),
    vncPass,
    profile,
    String(api),
  ]
  const env = {
    ...process.env,
    DISPLAY: display,
    SPOOF_PROFILE: profile,
    API: String(api),
    AVD_NAME: `emu_${did}`,
    SYS_IMG: sysImg(api),
  }
  env.EMU_ADB_PORT = String(adb)
  env.EMU_CONSOLE_PORT = String(adb - 1)
  const child = spawn('/opt/tools/start-device-session.sh', args, {
    env,
    detached: true,
    stdio: 'ignore',
  })
  try {
    child.unref()
  } catch {}

  res
    .status(200)
    .json({
      ok: true,
      device: { id: did, api, profile, vnc: vncPort, ws: wsPort, adb, status: 'starting' },
    })
}
