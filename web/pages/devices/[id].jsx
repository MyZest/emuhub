import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Device() {
  const router = useRouter()
  const { id, tab } = router.query
  const DEFAULT_ORDER = ['session', 'xvfb', 'x11vnc', 'websockify', 'emulator']
  const [api, setApi] = useState('34')
  const [versions, setVersions] = useState([])
  const [profile, setProfile] = useState('pixel_8_pro')
  const [profiles, setProfiles] = useState([])
  const [vnc, setVnc] = useState('admin')
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState({})
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      const resP = await fetch('/api/profiles')
      const jsonP = await resP.json()
      const list = (jsonP.profiles || []).map((item) => ({
        name: item.name || item,
        hasLogo: !!(item.hasLogo ?? false),
      }))
      setProfiles(list.length ? list : [{ name: 'pixel_8_pro', hasLogo: false }])
      const resV = await fetch('/api/versions')
      const jsonV = await resV.json()
      setVersions(jsonV.versions || [{ api: 34, installed: true }])
    }
    load()
  }, [])

  const start = async () => {
    if (!id) return
    setStatus('Starting...')
    const res = await fetch(`/api/devices/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api, profile, vnc_pass: vnc }),
    })
    const json = await res.json()
    setStatus('Started')
    router.push(`/devices/${id}?tab=logs`)
  }

  const loadLogs = async () => {
    if (!id) return
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/devices/${id}/logs?tail=200`)
      const json = await res.json()
      setLogs(json || {})
    } catch {
      setLogs({})
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (tab === 'logs') loadLogs()
  }, [tab, id])

  return (
    <main className="main">
      {tab === 'logs' ? (
        <>
          <h3>Device Logs {id}</h3>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="primary" onClick={loadLogs} disabled={loadingLogs}>
              {loadingLogs ? 'Loading...' : 'Refresh'}
            </button>
            <input
              className="input"
              placeholder="Filter keywords"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginLeft: 12 }}
            />
            <button className="" onClick={() => setLogs({})} style={{ marginLeft: 8 }}>
              Clear
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            {Object.keys(logs).length === 0 ? (
              <div className="muted">No logs</div>
            ) : (
              DEFAULT_ORDER.map((name) =>
                logs[name] ? (
                  <div key={name} style={{ marginBottom: 12 }}>
                    <div className="muted" style={{ marginBottom: 4 }}>
                      {name}.log
                    </div>
                    <pre className="code" style={{ maxHeight: 300, overflow: 'auto', padding: 8 }}>
                      {(logs[name] || [])
                        .filter((line) => !filter || String(line).includes(filter))
                        .join('\n')}
                    </pre>
                  </div>
                ) : null
              )
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Start Device {id}</h3>
          <div className="controls">
            <label>
              Android API
              <select className="select" value={api} onChange={(e) => setApi(e.target.value)}>
                {versions.map((v) => (
                  <option key={v.api} value={String(v.api)}>
                    {v.api} {v.installed ? '(installed)' : '(download)'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="grid">
              {profiles.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setProfile(p.name)}
                  className={`profile-btn ${profile === p.name ? 'active' : ''}`}
                >
                  <div className="img-wrap">
                    {p.hasLogo ? (
                      <img
                        className="profile-img"
                        src={`/api/profile-logo/${p.name}`}
                        alt={p.name}
                      />
                    ) : (
                      <span className="muted">No Logo</span>
                    )}
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {p.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="controls" style={{ marginTop: 12 }}>
            <label>
              VNC Password
              <input className="input" value={vnc} onChange={(e) => setVnc(e.target.value)} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="primary" onClick={start}>
              Start
            </button>
            <div className="muted" style={{ alignSelf: 'center' }}>
              {status}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
