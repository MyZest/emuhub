## 目标
- 通过修改/构建 AOSP 自定义系统镜像，在模拟器创建前即预置所需属性（含只读 `ro.*` 与持久化 `persist.*`）。

## 选择产品与设备架构
- 开发/验证推荐：`aosp_x86_64-userdebug` 或 `sdk_gphone_x86_64-userdebug`（新 Emulator 与主流系统镜像兼容最好）。
- 若需长期维护，创建自有设备树 `device/<vendor>/<product>/`，以自定义产品名例如 `aosp_<product>-userdebug`。

## 设备树与属性注入
- 新建或复用设备树：
  - `device/<vendor>/<product>/AndroidProducts.mk` 指向 `aosp_<product>.mk`
  - `device/<vendor>/<product>/device.mk`、`BoardConfig.mk`
  - 可选：`system.prop`（用于写入 `/system/build.prop`）
- Android 9.0+推荐：用 `PRODUCT_PROPERTY_OVERRIDES += key=value` 将属性写入 `/vendor/build.prop`（厂商私有属性）。
- 如确需写入 `/system/build.prop`（含部分 `ro.*`）：在 `BoardConfig.mk` 添加 `TARGET_SYSTEM_PROP += device/<vendor>/<product>/system.prop` 并在 `system.prop` 中列出键值。
- 示例：
  - `device.mk` 中：
    - `PRODUCT_PROPERTY_OVERRIDES += persist.demo.token=abc123`
    - `PRODUCT_PROPERTY_OVERRIDES += ro.vendor.demo.mode=true`
  - `system.prop` 中（配合 `TARGET_SYSTEM_PROP`）：
    - `ro.demo.mode=true`

## 构建镜像
- 运行：`lunch aosp_<product>-userdebug`（或 `aosp_x86_64-userdebug`）
- 构建：`m -j`，生成 `out/target/product/<product>/system.img`、`ramdisk.img`、`kernel-ranchu`（或对应预置内核）。

## 使用自定义镜像运行 Emulator
- 直接运行（无需先创建 AVD）：
  - `~/Library/Android/sdk/emulator/emulator -system <out/.../system.img> -ramdisk <out/.../ramdisk.img> -kernel <prebuilts/qemu-kernel/.../kernel-qemu2> -wipe-data`
- 或创建 AVD 后在命令行用 `-system/-ramdisk/-kernel` 覆盖默认镜像。

## 验证
- 启动后用 `adb shell getprop ro.demo.mode`、`adb shell getprop ro.vendor.demo.mode`、`adb shell getprop persist.demo.token` 验证值。
- 重启验证 `persist.*` 是否保持。

## 注意
- `ro.*` 属性建议在镜像内设置；运行时覆盖不总是可靠。
- 将自定义属性尽量采用 `ro.vendor.*`/`persist.*` 前缀，符合 9.0+ 分区与安全模型。
- 若采用 `sdk_gphone_*`，注意与 Emulator 版本匹配（内核版本、ranchu/qt 环境）。

## 交付物
- 可复用的设备树目录与产品配置文件集。
- 构建出的 `system.img`/`ramdisk.img`/内核文件。
- 运行与验证脚本示例（命令行参数清单）。