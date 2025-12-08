#!/usr/bin/env python3
import os
import json
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, 'models.json')
SKINS_DIR = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'emulator-configuration', 'skins'))

def list_dirs(path):
    try:
        return sorted([d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))])
    except Exception:
        return []

def is_phone(name):
    n = name.lower()
    if n.startswith('tv_') or n.startswith('wearos_') or n.startswith('automotive_'):
        return False
    tablets = {'nexus_7','nexus_7_2013','nexus_9','nexus_10','pixel_c','pixel_tablet'}
    if n in tablets:
        return False
    return True

def derive(name):
    spec = importlib.util.spec_from_file_location('gp', os.path.join(HERE, 'gen_profiles.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.derive_props(name)

def main():
    skins = [n for n in list_dirs(SKINS_DIR) if is_phone(n)]
    models = json.load(open(MODELS, 'r', encoding='utf-8'))
    added = []
    for n in skins:
        if n in models:
            continue
        m = derive(n)
        models[n] = {
            'manufacturer': m['manufacturer'],
            'brand': m['brand'],
            'model': m['model'],
            'name': m['name'],
            'device': m['device'],
            'build_type': m['build_type'],
            'build_tags': m['build_tags'],
            'build_flavor': m['build_flavor'],
            'fingerprint_system': m['fingerprint_system'],
            'fingerprint_vendor': m['fingerprint_vendor'],
            'fingerprint_bootimage': m['fingerprint_bootimage'],
            'vendor_security_patch': m['vendor_security_patch'],
        }
        added.append(n)
    json.dump(models, open(MODELS, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('added', ','.join(added))

if __name__ == '__main__':
    main()
