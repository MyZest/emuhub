import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query
  const n = String(name || '')
  if (req.method !== 'DELETE') return res.status(405).json({ ok:false })
  if (!n || !/^[a-zA-Z0-9_\-]+$/.test(n)) return res.status(400).json({ ok:false, error:'invalid name' })
  const file = path.join('/data/spoof/profiles', `${n}.props`)
  try {
    fs.unlinkSync(file)
    return res.status(200).json({ ok:true })
  } catch {
    return res.status(404).json({ ok:false })
  }
}
/**
 * API: DELETE /api/profiles/[name]
 * - 删除动态机型 props 文件 (/data/spoof/profiles/<name>.props)
 *   路径参数: name (字母数字/_-)
 *   返回: { ok:true } 或 { ok:false }
 * @swagger
 * /api/profiles/{name}:
 *   delete:
 *     summary: 删除动态机型
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
