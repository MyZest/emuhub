import fs from 'fs'

export default function handler(req, res) {
  const { name } = req.query
  const n = String(name || '')
  const paths = [
    `/data/spoof/profiles/${n}.png`,
    `/data/spoof/profiles/${n}.svg`,
    `/opt/spoof/profiles/${n}.png`,
    `/opt/spoof/profiles/${n}.svg`
  ]
  const p = paths.find(f => fs.existsSync(f))
  if (!p) return res.status(404).end()
  const ext = p.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  res.setHeader('Content-Type', ext)
  fs.createReadStream(p).pipe(res)
}

