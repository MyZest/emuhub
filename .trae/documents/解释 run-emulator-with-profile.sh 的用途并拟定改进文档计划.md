## 现状与问题
- 皮肤目录包含众多机型（如 Pixel/Nexus/TV/WearOS/Automotive/Samsung），参见 `emulator-configuration/skins` 列表。
- 内置 props 仅由 `android-docker/common/spoof/models.json` 两项生成（`pixel_8_pro`、`pixel_7`），构建阶段执行 `Dockerfile:60` 的 `python3 /opt/spoof/gen_profiles.py`。
- 运行时强制要求存在 props：`android-docker/common/tools/run-emulator-with-profile.sh:7–10`，否则退出；注入阶段在 `23–28` 行构造 `-prop`。

## 目标
- 生成与 `emulator-configuration/skins` 同名的 `.props`，覆盖全部机型；保证“皮肤名 = Profile 名 = props 文件名”，实现全局默认一一配对。
- 不依赖用户上传也能启动任意皮肤机型的伪装会话。

## 技术方案
- 扩展生成器：重写 `android-docker/common/spoof/gen_profiles.py`，新增对 `emulator-configuration/skins` 的遍历；对每个皮肤目录名 `name` 生成 `OUT_DIR=/opt/spoof/profiles/${name}.props`。
- 元数据来源与规则：
  - 建立厂商/品牌映射：
    - 前缀 `pixel*|nexus*|tv_*|wearos_*|automotive_*|pixel_*` → manufacturer `Google`、brand `google`
    - 前缀 `galaxy_*|Galaxy_*` → manufacturer `Samsung`、brand `samsung`
  - `model`：将目录名转为可读名（如 `pixel_8_pro` → `Pixel 8 Pro`，`tv_4k` → `Android TV 4K`，`wearos_large_round` → `Wear OS Large Round`）。
  - `device/name`：使用目录名原样（确保与皮肤名一致）。
  - `build_*` 与 `fingerprint_*`：生成通用占位（基于 Android 14/15 模板），结构符合 `web/pages/api/profiles.js:13–27` 的白名单键；`vendor_security_patch` 使用近期日期。
  - 通用 ABI/Native Bridge 行：保留现有生成器的 10 行（`ro.product.cpu.*`、`ro.dalvik.vm.native.bridge`、`ro.enable.native.bridge.*`、`ro.zygote`、`persist.sys.nativebridge`）。
- 特例处理：
  - 复合皮肤（如 `pixel_fold` 含子目录 `closed/`、`default/`）：props 仍以根目录名生成；皮肤选择逻辑现有脚本已按根名工作（`android-docker/common/tools/run-emulator-with-profile.sh:35`）。
  - 不常见命名：保留目录名为 `device/name`，model 经正则归一；允许后续人工校正。
- 生成器输入结构：
  - 保留 `models.json` 作为“精确机型表”，优先覆盖（如 Pixel 最新机型）。
  - 新增“自动补全”流程：对 skins 中未在 `models.json` 的条目，按规则生成 props。

## 交付修改点
- 更新 `gen_profiles.py`：
  - 读取 `HERE/../..../emulator-configuration/skins` 列表（相对路径到仓库根）
  - 载入 `models.json`，构建索引；对缺失项应用生成规则；写入 `/opt/spoof/profiles/<name>.props`
- 保持 `Dockerfile:60` 调用不变；新增说明：构建后 `/opt/spoof/profiles` 覆盖全量皮肤。
- 可选：放宽运行时严格校验，将 `run-emulator-with-profile.sh` 在缺少 props 时退化为“最小 props 模板”而非退出（保留告警）。

## 验证步骤
- 构建镜像后调用 `GET /api/profiles`（`web/pages/api/profiles.js:75–81`），确认列表与 `emulator-configuration/skins` 名称集合一致，且 `hasLogo` 与皮肤图片匹配（`web/pages/api/profile-logo/[name].js:18–31`）。
- 逐个以 `PROFILE=<skin_name>`、不同 `API` 启动会话（`android-docker/common/tools/start-device-session.sh:4–23`），验证 Emulator 正常启动且 `-prop` 注入生效（查看 `emulator.log`）。

## 风险与缓解
- 指纹字段准确性：占位默认值可能与真实设备指纹不完全一致；后续可逐步在 `models.json` 校正关键机型。
- 厂商归类偏差：对第三方皮肤命名采用启发式归类，允许通过 `models.json` 精修。

## 后续增强
- 提供前端“一键为缺失皮肤生成 props”入口，调用后端批量生成；或在 `POST /api/profiles` 允许从皮肤名自动填充模板。
- 增加脚本 `audit-props-vs-skins` 输出覆盖率报告，便于持续维护。

请确认以上方案，我将据此更新生成器并提交改动。