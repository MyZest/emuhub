import net from 'net'

function checkPort(port, host = '127.0.0.1', timeout = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let done = false
    const finish = (inUse) => {
      if (done) return
      done = true
      try {
        socket.destroy()
      } catch {}
      resolve({ inUse })
    }
    socket.setTimeout(timeout)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    try {
      socket.connect(port, host)
    } catch {
      finish(false)
    }
  })
}

export default async function handler(req, res) {
  const adbParam = Number(req.query.adb || 0)
  const vncParam = Number(req.query.vnc || 0)
  const wsParam = Number(req.query.ws || 0)
  const ports = []
  const result = {}
  if (Number.isFinite(adbParam) && adbParam > 0) {
    ports.push(['adb', adbParam])
    ports.push(['vnc', adbParam + 1])
    ports.push(['ws', adbParam + 2])
  }
  if (Number.isFinite(vncParam) && vncParam > 0) ports.push(['vnc', vncParam])
  if (Number.isFinite(wsParam) && wsParam > 0) ports.push(['ws', wsParam])
  for (const [name, p] of ports) {
    // 避免重复检测
    if (result[name]) continue
    // 范围限制
    if (!Number.isInteger(p) || p < 1024 || p > 65535) {
      result[name] = { inUse: false, invalid: true }
      continue
    }
    result[name] = await checkPort(p)
  }
  res.status(200).json({ ok: true, ...result })
}

