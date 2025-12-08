import type { NextApiRequest, NextApiResponse } from 'next'
import { spawn, spawnSync } from 'child_process'

function sysImg(api: number) {
  return `system-images;android-${api};google_apis;x86_64`;
}

type StartBody = { api?: number; profile?: string; vnc_pass?: string }
type StartOk = { ok: true; device: { api: number; profile: string; vnc: number; ws: number } }
type ErrorResp = { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StartOk | ErrorResp>
) {
  const { id } = req.query;
  const did = parseInt(String(id), 10);
  const body = req.body as StartBody
  const api = parseInt(String(body?.api ?? 34), 10);
  const allowedApis = [30,32,34];
  if (!allowedApis.includes(api)) return res.status(400).json({ ok:false, error:'invalid api' });
  const profile = String(body?.profile ?? process.env.SPOOF_PROFILE ?? 'pixel_8_pro');
  if (!/^[a-zA-Z0-9_\-]+$/.test(profile)) return res.status(400).json({ ok:false, error:'invalid profile' });
  const vncPass = String(body?.vnc_pass ?? 'admin');
  if (vncPass.length < 1 || vncPass.length > 64) return res.status(400).json({ ok:false, error:'invalid vnc_pass length' });

  const display = `:${10 + did}`;
  const vncPort = 5900 + did;
  const wsPort = 6080 + did;

  // ensure system image
  spawnSync('/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager', [sysImg(api)], { stdio: 'inherit' });

  const env = { ...process.env, DISPLAY: display, SPOOF_PROFILE: profile, API: String(api), AVD_NAME: `emu_${profile}_api${api}_d${did}`, SYS_IMG: sysImg(api) };

  // Xvfb
  spawn('Xvfb', [display, '-screen', '0', '1280x800x24']);
  // VNC password
  const passwdFile = `/tmp/vnc_pass_${did}`;
  spawnSync('bash', ['-lc', `x11vnc -storepasswd '${vncPass}' ${passwdFile}`], { stdio: 'inherit' });
  // x11vnc
  spawn('x11vnc', ['-display', display, '-forever', '-rfbport', String(vncPort), '-shared', '-passwdfile', passwdFile]);
  // websockify
  spawn('websockify', [String(wsPort), `localhost:${vncPort}`]);
  // emulator
  spawn('/opt/tools/run-emulator-with-profile.sh', [], { env });

  res.status(200).json({ ok: true, device: { api, profile, vnc: vncPort, ws: wsPort } });
}
/**
 * API: POST /api/devices/:id/start
 * - 启动指定设备实例的 Emulator
 *   入参(JSON): { api:number, profile:string, vnc_pass:string }
 *   行为: 确保系统镜像(懒安装) → 启动 Xvfb → x11vnc(密码) → websockify → 以 -prop 注入伪装属性并启动 Emulator
 *   返回: { ok:true, device:{ api, profile, vnc:number, ws:number } }
 * @swagger
 * /api/devices/{id}/start:
 *   post:
 *     summary: 启动设备实例
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               api:
 *                 type: integer
 *               profile:
 *                 type: string
 *               vnc_pass:
 *                 type: string
 *     responses:
 *       200:
 *         description: 启动成功
 */
