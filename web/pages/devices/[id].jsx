import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Device() {
  const router = useRouter()
  const { id } = router.query
  const [api, setApi] = useState('34')
  const [versions, setVersions] = useState([])
  const [profile, setProfile] = useState('pixel_8_pro')
  const [profiles, setProfiles] = useState([])
  const [vnc, setVnc] = useState('admin')
  const [status, setStatus] = useState('')

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
    const ws = json.device.ws
    window.location.href = `/novnc/vnc.html?path=websockify&port=${ws}`
  }

  return (
    <main className="main">
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
                  <img className="profile-img" src={`/api/profile-logo/${p.name}`} alt={p.name} />
                ) : (
                  <span className="muted">No Logo</span>
                )}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>{p.name}</div>
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
        <button className="primary" onClick={start}>Start</button>
        <div className="muted" style={{ alignSelf: 'center' }}>{status}</div>
      </div>
    </main>
  )
}
