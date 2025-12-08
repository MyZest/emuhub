import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Device() {
  const router = useRouter();
  const { id } = router.query;
  const [api, setApi] = useState('34');
  const [versions, setVersions] = useState<{api:number;installed:boolean}[]>([]);
  const [profile, setProfile] = useState('pixel_8_pro');
  const [profiles, setProfiles] = useState<string[]>([]);
  const [vnc, setVnc] = useState('admin');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      const resP = await fetch('/api/profiles');
      const jsonP = await resP.json();
      setProfiles(jsonP.profiles || ['pixel_8_pro']);
      const resV = await fetch('/api/versions');
      const jsonV = await resV.json();
      setVersions(jsonV.versions || [{api:34,installed:true}]);
    };
    load();
  }, []);

  const start = async () => {
    if (!id) return;
    setStatus('Starting...');
    const res = await fetch(`/api/devices/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api, profile, vnc_pass: vnc })
    });
    const json = await res.json();
    setStatus('Started');
    const ws = json.device.ws;
    window.location.href = `/novnc/vnc.html?path=websockify&port=${ws}`;
  };

  return (
    <main style={{fontFamily:'sans-serif',padding:20}}>
      <h3>Start Device {id}</h3>
      <label>Android API
        <select value={api} onChange={e=>setApi(e.target.value)}>
          {versions.map(v => (
            <option key={v.api} value={String(v.api)}>
              {v.api} {v.installed ? '(installed)' : '(download)'}
            </option>
          ))}
        </select>
      </label>
      <br/>
      <label>Profile
        <select value={profile} onChange={e=>setProfile(e.target.value)}>
          {profiles.map(p=> (<option key={p} value={p}>{p}</option>))}
        </select>
      </label>
      <br/>
      <label>VNC Password
        <input value={vnc} onChange={e=>setVnc(e.target.value)} />
      </label>
      <br/>
      <button onClick={start}>Start</button>
      <div style={{marginTop:12}}>{status}</div>
    </main>
  );
}
