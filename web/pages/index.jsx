import Link from 'next/link'
export default function Home() {
  return (
    <main className="main">
      <h2>Devices</h2>
      <ul>
        <li>
          <Link href="/devices/1">Device 1</Link>
        </li>
        <li>
          <Link href="/devices/2">Device 2</Link>
        </li>
        <li>
          <Link href="/devices/3">Device 3</Link>
        </li>
      </ul>
    </main>
  )
}
