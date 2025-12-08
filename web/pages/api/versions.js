import fs from 'fs'
import path from 'path'

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

function isInstalled(api) {
  const base = `/opt/android-sdk-linux/system-images/android-${api}/google_apis/x86_64`
  try {
    return fs.existsSync(base)
  } catch {
    return false
  }
}

export default function handler(req, res) {
  const apis = discoverApis()
  const list = apis.map((api) => ({ api, installed: isInstalled(api) }))
  res.status(200).json({ versions: list })
}
