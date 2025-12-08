import type { NextApiRequest, NextApiResponse } from 'next'
import { createSwaggerSpec } from 'next-swagger-doc'

/**
 * API: GET /api/swagger.json
 * - 生成 OpenAPI 规范，扫描 pages/api 下的 @swagger 注释
 *   返回: OpenAPI JSON
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
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

