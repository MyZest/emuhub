## 目标
- 在 `web/pages/api/devices/[id]/start.js` 中将设备 `id` 改为时间戳（`Date.now()`），不再依赖任何复杂的 `id` 拼接。

## 当前实现与影响点
- `id` 解析：`web/pages/api/devices/[id]/start.js:9-13` 现从路径参数取 `id` 并 `parseInt` 为 `did`。
- 端口/显示号：`display`, `vncPort`, `wsPort` 直接使用 `did` 偏移（`web/pages/api/devices/[id]/start.js:70-73`），若改为时间戳会导致端口超范围。
- 名称拼接：`AVD_NAME` 包含 `profile/api/did`（`web/pages/api/devices/[id]/start.js:97`），属复杂拼接的一部分。
- 日志接口：`web/pages/api/devices/[id]/logs.js:8-12` 读取目录 `/var/log/emuhub/d{id}`，与 `did` 一致即可，无需改动脚本。

## 拟改动
1. `did` 改为时间戳
   - 代码：忽略 `req.query.id`，设 `const did = Date.now()`。
2. 端口与显示号从 `did` 解耦，使用安全种子
   - 引入 `const seed = did % 1000`。
   - `display = ':' + (10 + seed)`，`vncPort = 5900 + seed`，`wsPort = 6080 + seed`，确保端口在合法区间且仍随会话变化。
3. 简化 `AVD_NAME`
   - 由 `emu_${profile}_api${api}_d${did}` 改为 `emu_${did}`，去掉复杂拼接，仅保留唯一标识。
4. 响应体中的 `device.id`
   - 返回时间戳 `did`。

## 兼容性与注意事项
- `start-device-session.sh` 接收的第一个参数仍为 `did`，改为时间戳不会影响其根据 `did` 建日志目录（`/var/log/emuhub/d{id}`）。
- 端口冲突：`seed` 取模法足够简化，但在并发极高时仍可能冲突；如需更稳妥可后续增加端口占用检测或集中分配器。
- 客户端若依赖 `AVD_NAME` 格式需同步调整为仅使用 `id`（本改动将返回 `AVD_NAME=emu_{timestamp}`）。

## 验证
- 发送 `POST /api/devices/{任意}/start`：返回的 `device.id` 为当前时间戳，`vnc/ws` 端口落在预期范围。
- 通过 `GET /api/devices/{timestamp}/logs?files=session,emulator&tail=50` 能读到 `/var/log/emuhub/d{timestamp}` 日志。
- 在运行环境中检查进程环境变量包含 `AVD_NAME=emu_{timestamp}`、`DISPLAY=:{10+seed}`。

## 后续可选优化（如需）
- 引入端口分配器（探测占用、租约过期）以消除端口冲突风险。
- 将日志目录也改为无前缀的 `{id}`（需配合外部脚本变更）。