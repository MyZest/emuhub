import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const { name } = req.query
  const n = String(name || '')
  const androidHome = process.env.ANDROID_HOME || '/opt/android-sdk-linux'
  const skinRoot = process.env.EMULATOR_SKINS_DIR || '/opt/app/emulator-configuration/skins'
  const sdkSkinRoot = path.join(androidHome, 'emulator', 'skins')
  const userImagesRoots = [
    process.env.USER_IMAGES_DIR,
    path.join(process.cwd(), 'user-configuration', 'images'),
    '/opt/app/user-configuration/images',
  ].filter(Boolean)
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9_\-]/g, '')
  const nn = norm(n)
  const candidates = [
    `/data/spoof/profiles/${n}.png`,
    `/data/spoof/profiles/${n}.svg`,
    `/opt/spoof/profiles/${n}.png`,
    `/opt/spoof/profiles/${n}.svg`,
    path.join(skinRoot, n, 'thumb.png'),
    path.join(skinRoot, n, 'back.png'),
    path.join(skinRoot, n, 'back.webp'),
    path.join(skinRoot, n, 'port_fore.webp'),
    path.join(sdkSkinRoot, n, 'thumb.png'),
    path.join(sdkSkinRoot, n, 'back.png'),
    path.join(sdkSkinRoot, n, 'back.webp'),
    path.join(sdkSkinRoot, n, 'port_fore.webp'),
  ]
  let fp = candidates.find((f) => {
    try {
      return fs.existsSync(f)
    } catch {
      return false
    }
  })
  if (!fp) {
    for (const root of userImagesRoots) {
      try {
        if (!fs.existsSync(root)) continue
        const files = fs.readdirSync(root)
        const hit = files.find((f) => {
          const base = norm(f)
          return base.includes(nn) || base.includes(`${nn}_emu`)
        })
        if (hit) { fp = path.join(root, hit); break }
      } catch {}
    }
  }
  if (!fp) return res.status(404).end()
  let ext = 'image/png'
  if (fp.endsWith('.svg')) ext = 'image/svg+xml'
  else if (fp.endsWith('.webp')) ext = 'image/webp'
  else if (fp.endsWith('.png')) ext = 'image/png'
  else if (fp.endsWith('.jpg') || fp.endsWith('.jpeg')) ext = 'image/jpeg'
  res.setHeader('Content-Type', ext)
  fs.createReadStream(fp).pipe(res)
}
