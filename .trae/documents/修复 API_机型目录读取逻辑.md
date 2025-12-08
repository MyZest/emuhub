## 你提供的目录
- API 版本目录根：`android-docker/`
- 机型(皮肤)目录根：`emulator-configuration/skins/`

## 定位到的脚本逻辑
- API 版本读取：`web/pages/api/versions.js:4-25` 只识别子目录名形如 `android34` 的格式（正则：`^android(\d+)$`），无法识别 `android-34` 或 `android_34`。
- 机型(皮肤)读取：`web/pages/api/skins.js:4-13,34-43` 已把 `process.cwd()/emulator-configuration/skins` 作为候选根，并回退到 `/opt/app/emulator-configuration/skins` 与 `ANDROID_HOME/emulator/skins`；`android-docker/common/spoof/gen_profiles.py:8-15` 也包含这几个候选根。

## 改动方案
1. 扩展 API 版本目录匹配
- 在 `web/pages/api/versions.js` 把正则从 `^android(\d+)$` 扩展为 `^android[-_]?(\d+)$`，兼容 `android34`、`android-34`、`android_34` 三种命名。
- 保持现有多根候选：`process.env.ANDROID_DOCKER_DIR`、`process.cwd()/android-docker`、`/opt/app/android-docker`。
- 结果仍与 SDK `system-images` 合并（`web/pages/api/versions.js:47-53`）。

2. 强化机型(皮肤)读取的一致性
- 保持 `skins.js` 的候选根不变，确保优先读取你提供的 `emulator-configuration/skins/`。
- 为稳健性（可选）：在 `skins.js` 与 `gen_profiles.py` 同步候选根集合，支持环境变量 `EMULATOR_SKINS_DIR` 显式指定；两者都按同样的顺序尝试，避免一边能读到、另一边读不到。

## 验证
- 在 `android-docker/` 下放置如 `android34`、`android-33`、`android_32` 三种命名的目录，`GET /api/versions` 应返回 `[32,33,34,...]` 并标注 `installed`（`web/pages/api/versions.js:55-67`）。
- 在 `emulator-configuration/skins/` 下放置机型目录（如 `pixel_8_pro`、`nexus_5x`），`GET /api/skins` 应返回全部机型。
- 运行 `android-docker/common/spoof/gen_profiles.py`，应在 `/opt/spoof/profiles` 生成每个机型对应的 `.props` 文件；`GET /api/profiles` 聚合显示（`web/pages/api/profiles.js:75-81`）。

## 说明
- 不改变你的目录结构，只提升脚本的匹配兼容性与健壮性。
- 若你愿意，我们也可加入 `ANDROID_DOCKER_DIRS`、`EMULATOR_SKINS_DIRS`（逗号分隔）来支持多根目录，但当前场景用不到。