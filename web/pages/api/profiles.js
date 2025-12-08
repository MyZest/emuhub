import fs from 'fs'
import path from 'path'

function listProps(dir) {
  try {
    const files = fs.readdirSync(dir)
    return files.filter((f) => f.endsWith('.props')).map((f) => path.basename(f, '.props'))
  } catch {
    return []
  }
}

function validLine(line) {
  if (!line.includes('=')) return false
  const [k] = line.split('=', 1)
  const allowed = [
    'ro.product.',
    'ro.vendor.',
    'persist.',
    'ro.dalvik.vm.',
    'ro.enable.native.bridge.',
    'ro.zygote',
    'ro.product.cpu.',
  ]
  if (k.startsWith('ro.board.platform')) return false
  return allowed.some((p) => k.startsWith(p))
}

function hasLogo(name) {
  const androidHome = process.env.ANDROID_HOME || '/opt/android-sdk-linux'
  const skinRoot = process.env.EMULATOR_SKINS_DIR || '/opt/app/emulator-configuration/skins'
  const sdkSkinRoot = `${androidHome}/emulator/skins`
  const userImagesRoots = [
    process.env.USER_IMAGES_DIR,
    path.join(process.cwd(), 'user-configuration', 'images'),
    '/opt/app/user-configuration/images',
  ].filter(Boolean)
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9_\-]/g, '')
  const n = norm(name)
  const cands = [
    `/data/spoof/profiles/${name}.png`,
    `/data/spoof/profiles/${name}.svg`,
    `/opt/spoof/profiles/${name}.png`,
    `/opt/spoof/profiles/${name}.svg`,
    `${skinRoot}/${name}/thumb.png`,
    `${skinRoot}/${name}/back.png`,
    `${skinRoot}/${name}/back.webp`,
    `${skinRoot}/${name}/port_fore.webp`,
    `${sdkSkinRoot}/${name}/thumb.png`,
    `${sdkSkinRoot}/${name}/back.png`,
    `${sdkSkinRoot}/${name}/back.webp`,
    `${sdkSkinRoot}/${name}/port_fore.webp`,
  ]
  const directHit = cands.some((p) => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })
  if (directHit) return true
  for (const root of userImagesRoots) {
    try {
      if (!fs.existsSync(root)) continue
      const files = fs.readdirSync(root)
      if (files.some((f) => {
        const base = norm(f)
        return base.includes(n) || base.includes(`${n}_emu`)
      })) return true
    } catch {}
  }
  return false
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const builtins = listProps('/opt/spoof/profiles')
    const dynamics = listProps('/data/spoof/profiles')
    const set = Array.from(new Set([...builtins, ...dynamics]))
    const items = set.map((name) => ({ name, hasLogo: hasLogo(name) }))
    return res.status(200).json({ profiles: items })
  }
  if (req.method === 'POST') {
    const body = req.body || {}
    const name = String(body.name || '').trim()
    const content = String(body.content || '')
    if (!name || !/^[a-zA-Z0-9_\-]+$/.test(name))
      return res.status(400).json({ ok: false, error: 'invalid name' })
    if (content.length > 16000)
      return res.status(400).json({ ok: false, error: 'content too large' })
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0 || lines.length > 200)
      return res.status(400).json({ ok: false, error: 'invalid size' })
    if (!lines.every(validLine)) return res.status(400).json({ ok: false, error: 'invalid lines' })
    const dir = '/data/spoof/profiles'
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch {}
    const file = path.join(dir, `${name}.props`)
    fs.writeFileSync(file, lines.join('\n') + '\n')
    return res.status(200).json({ ok: true, name })
  }
  return res.status(405).json({ ok: false, error: 'method not allowed' })
}
