# 通过自定义镜像在模拟器创建前预置系统属性

## 属性来源与 system.prop 位置
- 默认加载顺序：`/prop.default` 或 `/default.prop`、`/system/build.prop`、`/vendor/build.prop`、`/data/local.prop`、`/data/property/*`（后加载覆盖先加载）。
- AOSP 仿真设备常见 `system.prop`：`device/generic/goldfish/system.prop` 或你自定义设备树 `device/<vendor>/<product>/system.prop`。
- Android 9.0+建议用 `PRODUCT_PROPERTY_OVERRIDES` 写入 `/vendor/build.prop` 以承载厂商私有属性。

## 集成设备树模板
- 将本仓库中的 `device/emuhub/emuhub/` 目录合并到 AOSP 源码对应位置。
- 关键文件：
  - `AndroidProducts.mk` 指向 `aosp_emuhub.mk`
  - `aosp_emuhub.mk` 声明产品并继承 `device.mk`
  - `device.mk` 通过 `PRODUCT_PROPERTY_OVERRIDES` 写入 `/vendor/build.prop`
  - `BoardConfig.mk` 设置 `TARGET_SYSTEM_PROP` 并入 `/system/build.prop`
  - `system.prop` 示例写入 `ro.demo.mode=true`

## 构建
- 选择产品：`lunch aosp_emuhub-userdebug`
- 编译：`m -j`
- 产物位置：`out/target/product/emuhub/` 下的 `system.img`、`ramdisk.img`、`kernel`。

## 运行
- 使用脚本（指定机型伪装）：
  - 构建期自动生成：无需单独运行生成器，产品 `aosp_emuhub.mk` 已集成
  - 预构建：`SPOOF_PROFILE=pixel_8_pro lunch aosp_emuhub-userdebug && m -j`
  - 启动：`scripts/emulator/run-with-profile.sh pixel_8_pro [avd_name]`
  - 若已存在通用镜像，也可：`scripts/emulator/run-with-custom-images.sh <system.img> <ramdisk.img> <kernel> [avd_name]`

## 验证
- 启动后执行：
  - `adb shell getprop ro.demo.mode`
  - `adb shell getprop ro.build.fingerprint`
  - `adb shell getprop ro.vendor.build.fingerprint`
  - `adb shell getprop ro.bootimage.build.fingerprint`
  - `adb shell getprop ro.build.type`
  - `adb shell getprop ro.build.tags`
  - `adb shell getprop ro.build.flavor`
  - `adb shell getprop ro.vendor.demo.mode`
  - `adb shell getprop persist.demo.token`
- 重启验证 `persist.*` 是否保持。

## 参考
- Android 官方命令行与目录说明：https://developer.android.com/studio/run/emulator-commandline
- AOSP 属性加载与 9.0+做法（中文）：http://qiushao.net/2019/11/20/Android系统开发入门/3-添加系统属性/
- 通过环境变量向 Emulator 注入参数（macOS 教程）：https://joachimschuster.de/posts/android-studio-emulator-with-parameters/
