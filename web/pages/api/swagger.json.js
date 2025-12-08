import { createSwaggerSpec } from 'next-swagger-doc'

export default function handler(req, res) {
  const spec = createSwaggerSpec({
    title: 'EmuHub API',
    version: '1.0.0',
    apiFolder: 'pages/api',
    definition: {
      openapi: '3.0.0',
      info: { title: 'EmuHub API', version: '1.0.0' },
      servers: [{ url: 'http://localhost:8080' }],
    },
  })
  res.status(200).json(spec)
}
