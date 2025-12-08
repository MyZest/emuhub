## 方案要点
- 构建期自动生成：在产品 `aosp_emuhub.mk` 中以 `$(shell python3 tools/spoof/gen_profiles.py)` 集成本仓库生成器，无需手动运行。
- 统一接入覆盖集：仍按环境变量 `SPOOF_PROFILE=<model_id>` 包含 `device/emuhub/spoof/<model_id>/props.mk`，保证系统/vendor/bootimage 指纹与构建信息一致。
- 安全兼容边界：不设置 `ro.board.platform`；ABI/Native-Bridge 作为独立最小必要集，避免破坏 HAL 选择与 Emulator 行为。

## 将实施的改动
1. 更新 `device/emuhub/emuhub/aosp_emuhub.mk`
   - 在文件顶部加入：`$(shell python3 tools/spoof/gen_profiles.py)`，确保解析产品时即生成所有机型的 `props.mk`。
   - 保留现有 `SPOOF_PROFILE` 包含逻辑，构建时自动接入对应机型覆盖集。
2. 文档补充
   - 在 `docs/android/avd-system-props.md` 增加“构建期自动生成”的说明与最小使用步骤：
     - `SPOOF_PROFILE=pixel_8_pro lunch aosp_emuhub-userdebug && m -j`
     - `scripts/emulator/run-with-profile.sh pixel_8_pro [avd_name]`
3. VNC 集成建议
   - 在 VNC 启动后台逻辑中，读取用户选择的机型 ID，直接调用 `scripts/emulator/run-with-profile.sh <model_id>` 启动；这样在页面打开时属性即已生效。

## 使用示例
- 选择并构建：`SPOOF_PROFILE=pixel_8_pro lunch aosp_emuhub-userdebug && m -j`
- 启动：`scripts/emulator/run-with-profile.sh pixel_8_pro`
- 验证：`adb shell getprop ro.build.fingerprint`、`ro.vendor.build.fingerprint`、`ro.bootimage.build.fingerprint`、`ro.build.type/tags/flavor`

## 说明
- 该集成方式最兼容 AOSP Make；不会引入 Soong 自定义模块或复杂依赖，生成器按需运行且无人工步骤。
- 若要批量生成与构建所有机型，可在 CI 层并行设置不同 `SPOOF_PROFILE` 执行；生成器本身已一次性产出所有 `props.mk`。

确认后我将按以上内容更新 `aosp_emuhub.mk` 与文档，以实现“构建镜像时自动生成并全局伪装成功”。