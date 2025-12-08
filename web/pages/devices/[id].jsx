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
    <main style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h3>Start Device {id}</h3>
      <label>
        Android API
        <select value={api} onChange={(e) => setApi(e.target.value)}>
          {versions.map((v) => (
            <option key={v.api} value={String(v.api)}>
              {v.api} {v.installed ? '(installed)' : '(download)'}
            </option>
          ))}
        </select>
      </label>
      <br />
      <div style={{ margin: '8px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {profiles.map((p) => (
            <button
              key={p.name}
              onClick={() => setProfile(p.name)}
              style={{
                border: profile === p.name ? '2px solid #0070f3' : '1px solid #ccc',
                borderRadius: 8,
                padding: 8,
                textAlign: 'center',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {p.hasLogo ? (
                  <img
                    src={`/api/profile-logo/${p.name}`}
                    alt={p.name}
                    style={{ maxHeight: 64, maxWidth: 120 }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: '#888' }}>No Logo</span>
                )}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>{p.name}</div>
            </button>
          ))}
        </div>
      </div>
      <br />
      <label>
        VNC Password
        <input value={vnc} onChange={(e) => setVnc(e.target.value)} />
      </label>
      <br />
      <button onClick={start}>Start</button>
      <div style={{ marginTop: 12 }}>{status}</div>
    </main>
  )
}
