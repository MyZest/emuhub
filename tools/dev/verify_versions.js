#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

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
          const m = name.match(/^android[-_]?(\d+)$/)
          return m ? parseInt(m[1], 10) : null
        })
        .filter((n) => typeof n === 'number')
      if (list.length) return list.sort((a, b) => a - b)
    } catch {}
  }
  return []
}

const apis = readApisFromAndroidDocker()
console.log(JSON.stringify({ apis }, null, 2))

