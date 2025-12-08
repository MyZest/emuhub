import fs from 'fs'

function isInstalled(api) {
  const base = `/opt/android-sdk-linux/system-images/android-${api}/google_apis/x86_64`
  try {
    return fs.existsSync(base)
  } catch {
    return false
  }
}

export default function handler(req, res) {
  const list = [30,32,34].map(api => ({ api, installed: isInstalled(api) }))
  res.status(200).json({ versions: list })
}

