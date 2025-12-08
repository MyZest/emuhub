#!/usr/bin/env python3
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, 'models.json')

CODENAMES = {
    'pixel_2': 'walleye',
    'pixel_2_xl': 'taimen',
    'pixel_3': 'blueline',
    'pixel_3_xl': 'crosshatch',
    'pixel_3a': 'sargo',
    'pixel_3a_xl': 'bonito',
    'pixel_4': 'flame',
    'pixel_4_xl': 'coral',
    'pixel_4a': 'sunfish',
    'pixel_5': 'redfin',
    'pixel_6': 'oriole',
    'pixel_6_pro': 'raven',
    'pixel_6a': 'bluejay',
    'pixel_7': 'panther',
    'pixel_7_pro': 'cheetah',
    'pixel_7a': 'lynx',
    'pixel_8': 'shiba',
    'pixel_8_pro': 'husky',
    'pixel_fold': 'felix',
}

def build_fp(brand, codename, release, build_id, incremental):
    return f"{brand}/{codename}/{codename}:{release}/{build_id}/{incremental}:user/release-keys"

def main():
    with open(MODELS, 'r', encoding='utf-8') as f:
        models = json.load(f)
    updates = {}
    for name, code in CODENAMES.items():
        updates[name] = {
            'brand': 'google',
            'codename': code,
            'release': '16',
            'build_id': 'BP4A.251205.006',
            'incremental': '14401865',
        }
    for key, info in updates.items():
        if key not in models:
            models[key] = {
                'manufacturer': 'Google',
                'brand': 'google',
                'model': ' '.join([p.capitalize() for p in key.split('_')]),
                'name': key,
                'device': key,
                'build_type': 'user',
                'build_tags': 'release-keys',
                'build_flavor': f"{key}-user",
                'fingerprint_system': '',
                'fingerprint_vendor': '',
                'fingerprint_bootimage': '',
                'vendor_security_patch': '2024-09-05',
            }
        fp = build_fp(info['brand'], info['codename'], info['release'], info['build_id'], info['incremental'])
        models[key]['fingerprint_system'] = fp
        models[key]['fingerprint_vendor'] = fp
        models[key]['fingerprint_bootimage'] = fp
    with open(MODELS, 'w', encoding='utf-8') as f:
        json.dump(models, f, indent=2, ensure_ascii=False)
    print('updated', ','.join(sorted(updates.keys())))

if __name__ == '__main__':
    main()
