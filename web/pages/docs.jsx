import dynamic from 'next/dynamic'
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function Docs() {
  return (
    <main style={{ height: '100vh' }}>
      <SwaggerUI url="/api/swagger.json" />
    </main>
  )
}
