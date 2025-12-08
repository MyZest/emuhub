import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

function isInstalled(api: number) {
  const base = `/opt/android-sdk-linux/system-images/android-${api}/google_apis/x86_64`
  try {
    return fs.existsSync(base)
  } catch {
    return false
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const list = [30,32,34].map(api => ({ api, installed: isInstalled(api) }))
  res.status(200).json({ versions: list })
}
/**
 * API: GET /api/versions
 * - 列出支持的 Android API 以及是否已安装（基于系统镜像目录检测）
 *   返回: { versions: Array<{ api:number; installed:boolean }> }
 * @swagger
 * /api/versions:
 *   get:
 *     summary: 列出 Android 版本与安装状态
 *     responses:
 *       200:
 *         description: 版本列表
 */
