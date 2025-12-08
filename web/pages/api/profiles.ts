import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

function listProps(dir: string) {
  try {
    const files = fs.readdirSync(dir)
    return files.filter(f=>f.endsWith('.props')).map(f=>path.basename(f,'.props'))
  } catch {
    return []
  }
}

function validLine(line: string) {
  if (!line.includes('=')) return false
  const [k] = line.split('=',1)
  const allowed = [
    'ro.product.',
    'ro.vendor.',
    'persist.',
    'ro.dalvik.vm.',
    'ro.enable.native.bridge.',
    'ro.zygote',
    'ro.product.cpu.'
  ]
  if (k.startsWith('ro.board.platform')) return false
  return allowed.some(p=>k.startsWith(p))
}

type ProfilesResponse = { profiles: string[] }
type PostBody = { name?: string; content?: string }
type ErrorResponse = { ok: false; error: string }
type PostSuccess = { ok: true; name: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfilesResponse | PostSuccess | ErrorResponse>
) {
  if (req.method === 'GET') {
    const builtins = listProps('/opt/spoof/profiles')
    const dynamics = listProps('/data/spoof/profiles')
    const set = new Set<string>([...builtins, ...dynamics])
    return res.status(200).json({ profiles: Array.from(set) })
  }
  if (req.method === 'POST') {
    const body = req.body as PostBody
    const name = String(body?.name || '').trim()
    const content = String(body?.content || '')
    if (!name || !/^[a-zA-Z0-9_\-]+$/.test(name)) return res.status(400).json({ ok:false, error:'invalid name' })
    if (content.length > 16000) return res.status(400).json({ ok:false, error:'content too large' })
    const lines = content.split('\n').map(l=>l.trim()).filter(l=>l.length>0)
    if (lines.length === 0 || lines.length > 200) return res.status(400).json({ ok:false, error:'invalid size' })
    if (!lines.every(validLine)) return res.status(400).json({ ok:false, error:'invalid lines' })
    const dir = '/data/spoof/profiles'
    try { fs.mkdirSync(dir, { recursive: true }) } catch {}
    const file = path.join(dir, `${name}.props`)
    fs.writeFileSync(file, lines.join('\n') + '\n')
    return res.status(200).json({ ok:true, name })
  }
  return res.status(405).json({ ok:false, error: 'method not allowed' })
}
/**
 * API: GET /api/profiles
 * - 列出可用机型名称，合并 /opt/spoof/profiles 与 /data/spoof/profiles 两目录
 *   返回: { profiles: string[] }
 * API: POST /api/profiles
 * - 上传动态机型 props 文件
 *   入参(JSON): { name: string, content: string }
 *   约束: name 为字母数字/_-，content 为多行 key=value，拒绝危险键(如 ro.board.platform)
 *   返回: { ok: true, name } 或 { ok:false, error }
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: 列出可用机型
 *     responses:
 *       200:
 *         description: 机型列表
 *   post:
 *     summary: 上传动态机型
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 上传成功
 */
 */
