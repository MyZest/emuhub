import fs from 'fs'
import path from 'path'

const LOG_DIR_BASE = '/var/log/emuhub'
const DEFAULT_FILES = ['session', 'xvfb', 'x11vnc', 'websockify', 'emulator']
const FILE_WHITELIST = new Set(DEFAULT_FILES)

function safeLogPath(id, name) {
  if (!FILE_WHITELIST.has(name)) return null
  const dir = path.join(LOG_DIR_BASE, `d${id}`)
  return path.join(dir, `${name}.log`)
}

function readLastLines(filePath, n = 200, byteLimit = 1024 * 1024) {
  try {
    if (!fs.existsSync(filePath)) return []
    const stat = fs.statSync(filePath)
    const size = stat.size
    const readLen = Math.min(size, byteLimit)
    const fd = fs.openSync(filePath, 'r')
    try {
      const buffer = Buffer.alloc(readLen)
      const position = size - readLen
      fs.readSync(fd, buffer, 0, readLen, position)
      const text = buffer.toString('utf8')
      const lines = text.split(/\r?\n/)
      const tail = lines.slice(Math.max(0, lines.length - n))
      return tail
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return []
  }
}

export default function handler(req, res) {
  const { id } = req.query
  const filesParam = String(req.query.files || '')
  const tailParam = Number(req.query.tail || 200)
  const n = Number.isFinite(tailParam) ? Math.max(1, Math.min(2000, tailParam)) : 200

  const names = (filesParam ? filesParam.split(',') : DEFAULT_FILES).filter(Boolean)
  const result = {}

  for (const name of names) {
    const p = safeLogPath(id, name)
    if (!p) {
      result[name] = []
      continue
    }
    result[name] = readLastLines(p, n)
  }

  res.status(200).json(result)
}
