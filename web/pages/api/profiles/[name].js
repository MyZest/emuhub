import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const { name } = req.query
  const n = String(name || '')
  if (req.method !== 'DELETE')
    return res.status(405).json({ ok: false, error: 'method not allowed' })
  if (!n || !/^[a-zA-Z0-9_\-]+$/.test(n))
    return res.status(400).json({ ok: false, error: 'invalid name' })
  const file = path.join('/data/spoof/profiles', `${n}.props`)
  try {
    fs.unlinkSync(file)
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(404).json({ ok: false, error: 'not found' })
  }
}
