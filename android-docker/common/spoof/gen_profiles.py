#!/usr/bin/env python3
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = "/opt/spoof/profiles"

def main():
    with open(os.path.join(HERE, 'models.json'), 'r', encoding='utf-8') as f:
        models = json.load(f)
    os.makedirs(OUT_DIR, exist_ok=True)
    for mid, m in models.items():
        path = os.path.join(OUT_DIR, f"{mid}.props")
        lines = [
            f"ro.build.type={m['build_type']}",
            f"ro.build.tags={m['build_tags']}",
            f"ro.build.flavor={m['build_flavor']}",
            f"ro.build.fingerprint={m['fingerprint_system']}",
            f"ro.product.manufacturer={m['manufacturer']}",
            f"ro.product.brand={m['brand']}",
            f"ro.product.model={m['model']}",
            f"ro.product.name={m['name']}",
            f"ro.product.device={m['device']}",
            f"ro.vendor.build.type={m['build_type']}",
            f"ro.vendor.build.tags={m['build_tags']}",
            f"ro.vendor.build.fingerprint={m['fingerprint_vendor']}",
            f"ro.vendor.build.security_patch={m['vendor_security_patch']}",
            f"ro.bootimage.build.fingerprint={m['fingerprint_bootimage']}",
            # minimal ABI/bridge set (optional override)
            "ro.product.cpu.abilist=x86_64,x86,arm64-v8a,armeabi-v7a",
            "ro.product.cpu.abilist32=x86,armeabi-v7a",
            "ro.product.cpu.abilist64=x86_64,arm64-v8a",
            "ro.dalvik.vm.native.bridge=libndk_translation.so",
            "ro.enable.native.bridge.exec=1",
            "ro.enable.native.bridge.exec64=1",
            "ro.dalvik.vm.isa.arm=x86",
            "ro.dalvik.vm.isa.arm64=x86_64",
            "ro.zygote=zygote64_32",
            "persist.sys.nativebridge=1",
        ]
        with open(path, 'w', encoding='utf-8') as wf:
            wf.write("\n".join(lines) + "\n")
        print(f"Generated {path}")

if __name__ == '__main__':
    main()

