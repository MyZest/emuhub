import fs from 'fs'
import path from 'path'

function candidateSkinRoots() {
  const projRoot = process.cwd()
  const androidHome = process.env.ANDROID_HOME || '/opt/android-sdk-linux'
  return [
    process.env.EMULATOR_SKINS_DIR,
    path.join(projRoot, 'emulator-configuration', 'skins'),
    '/opt/app/emulator-configuration/skins',
    path.join(androidHome, 'emulator', 'skins'),
  ]
}

function firstExistingDir(paths) {
  for (const p of paths) {
    if (!p) continue
    try {
      if (fs.existsSync(p)) return p
    } catch {}
  }
  return null
}

function listSkinDirs(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    return entries.filter((d) => d.isDirectory()).map((d) => d.name)
  } catch {
    return []
  }
}

function discoverSkins() {
  const roots = candidateSkinRoots()
  const set = new Set()
  for (const root of roots) {
    const dir = firstExistingDir([root])
    if (!dir) continue
    for (const name of listSkinDirs(dir)) set.add(name)
  }
  return Array.from(set).sort()
}

function hasSkin(name) {
  if (!name) return false
  for (const root of candidateSkinRoots()) {
    const dir = firstExistingDir([root])
    if (!dir) continue
    try {
      const target = path.join(dir, name)
      if (fs.existsSync(target)) return true
    } catch {}
  }
  return false
}

export default function handler(req, res) {
  const skins = discoverSkins()
  const list = skins.map((name) => ({ name, available: hasSkin(name) }))
  res.status(200).json({ skins: list })
}
