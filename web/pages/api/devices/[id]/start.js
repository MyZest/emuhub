import fs from 'fs'
import path from 'path'

function sysImg(api) {
  return `system-images;android-${api};google_apis;x86_64`
}

export default async function handler(req, res) {
  const { id } = req.query
  const did = parseInt(String(id), 10)
  const body = req.body || {}
  const api = parseInt(String(body?.api ?? 34), 10)
  function readApisFromAndroidDocker() {
    const baseCandidates = [
      process.env.ANDROID_DOCKER_DIR,
      path.join(process.cwd(), 'android-docker'),
      '/opt/app/android-docker',
    ].filter(Boolean)
    for (const base of baseCandidates) {
      try {
        if (!fs.existsSync(base)) continue
        const entries = fs.readdirSync(base, { withFileTypes: true })
        const list = entries
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .map((name) => {
            const m = name.match(/^android(\d+)$/)
            return m ? parseInt(m[1], 10) : null
          })
          .filter((n) => typeof n === 'number')
        if (list.length) return list.sort((a, b) => a - b)
      } catch {}
    }
    return []
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

  const display = `:${10 + did}`
  const vncPort = 5900 + did
  const wsPort = 6080 + did

  // execa tagged template for clearer commands
  const { $ } = await import('execa')

  // run session setup via script
  const proc = await $('/opt/tools/start-device-session.sh', [
    String(did),
    display,
    String(vncPort),
    String(wsPort),
    vncPass,
    profile,
    String(api),
  ])
  let eff = { vnc: vncPort, ws: wsPort, api, profile }
  try {
    const out = String(proc.stdout || '').trim()
    if (out) eff = { ...eff, ...JSON.parse(out) }
  } catch {}

  const env = {
    ...process.env,
    DISPLAY: display,
    SPOOF_PROFILE: profile,
    API: String(api),
    AVD_NAME: `emu_${profile}_api${api}_d${did}`,
    SYS_IMG: sysImg(api),
  }

  // emulator is started by the script; return response

  res.status(200).json({ ok: true, device: { api: eff.api, profile: eff.profile, vnc: eff.vnc, ws: eff.ws } })
}
