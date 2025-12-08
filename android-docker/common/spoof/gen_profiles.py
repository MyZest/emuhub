#!/usr/bin/env python3
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.environ.get("SPOOF_OUT_DIR", "/opt/spoof/profiles")

def candidate_skin_roots():
    roots = [
        os.environ.get('EMULATOR_SKINS_DIR'),
        os.path.abspath(os.path.join(HERE, '..', '..', '..', 'emulator-configuration', 'skins')),
        "/opt/app/emulator-configuration/skins",
        os.path.join(os.environ.get('ANDROID_HOME') or '/opt/android-sdk-linux', 'emulator', 'skins'),
    ]
    return roots

def first_existing_dir(paths):
    for p in paths:
        if not p:
            continue
        try:
            if os.path.exists(p):
                return p
        except Exception:
            pass
    return None

def list_skin_dirs(dir_path):
    try:
        return sorted([d for d in os.listdir(dir_path) if os.path.isdir(os.path.join(dir_path, d))])
    except Exception:
        return []

def discover_skins():
    names = set()
    for root in candidate_skin_roots():
        dir_path = first_existing_dir([root])
        if not dir_path:
            continue
        for name in list_skin_dirs(dir_path):
            if name:
                names.add(name)
    return sorted(names)

def derive_props(name):
    n = str(name)
    low = n.lower()
    manufacturer = 'Generic'
    brand = 'generic'
    if low.startswith('pixel') or low.startswith('nexus') or low.startswith('tv_') or low.startswith('wearos'):
        manufacturer = 'Google'
        brand = 'google'
    elif low.startswith('galaxy') or ('samsung' in low):
        manufacturer = 'Samsung'
        brand = 'samsung'
    def to_model(s):
        s = s.replace('-', '_')
        parts = [p for p in s.split('_') if p]
        return ' '.join([p.capitalize() for p in parts])
    model = to_model(n)
    build_type = 'user'
    build_tags = 'release-keys'
    build_flavor = f"{n}-user"
    fp = f"{brand}/{n}/{n}:14/UD1A.fake/000000:user/release-keys"
    return {
        'manufacturer': manufacturer,
        'brand': brand,
        'model': model,
        'name': n,
        'device': n,
        'build_type': build_type,
        'build_tags': build_tags,
        'build_flavor': build_flavor,
        'fingerprint_system': fp,
        'fingerprint_vendor': fp,
        'fingerprint_bootimage': fp,
        'vendor_security_patch': '2024-09-05',
    }

def main():
    with open(os.path.join(HERE, 'models.json'), 'r', encoding='utf-8') as f:
        models = json.load(f)
    os.makedirs(OUT_DIR, exist_ok=True)
    skins = discover_skins()
    all_names = sorted(set(list(models.keys()) + skins))
    total = 0
    matched = 0
    derived = 0
    for name in all_names:
        m = models.get(name)
        if m is None:
            m = derive_props(name)
            derived += 1
        else:
            matched += 1
        path = os.path.join(OUT_DIR, f"{name}.props")
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
        total += 1
    print(f"Profiles: total={total}, models={matched}, derived={derived}")

if __name__ == '__main__':
    main()
