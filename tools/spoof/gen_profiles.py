#!/usr/bin/env python3
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILES_JSON = os.path.join(ROOT, 'spoof-profiles', 'models.json')
OUT_DIR = os.path.join('device', 'emuhub', 'spoof')

TEMPLATE = '''# auto-generated
PRODUCT_BUILD_PROP_OVERRIDES += \
  ro.build.type={build_type} \
  ro.build.tags={build_tags} \
  ro.build.flavor={build_flavor} \
  ro.build.fingerprint={fp_sys} \
  ro.product.manufacturer={manufacturer} \
  ro.product.brand={brand} \
  ro.product.model={model} \
  ro.product.name={name} \
  ro.product.device={device}

PRODUCT_PROPERTY_OVERRIDES += \
  ro.vendor.build.type={build_type} \
  ro.vendor.build.tags={build_tags} \
  ro.vendor.build.fingerprint={fp_vendor} \
  ro.vendor.build.security_patch={vendor_patch} \
  ro.bootimage.build.fingerprint={fp_boot}
'''

def main():
    with open(PROFILES_JSON, 'r', encoding='utf-8') as f:
        profiles = json.load(f)

    os.makedirs(OUT_DIR, exist_ok=True)
    for model_id, cfg in profiles.items():
        out_model_dir = os.path.join(OUT_DIR, model_id)
        os.makedirs(out_model_dir, exist_ok=True)
        mk_path = os.path.join(out_model_dir, 'props.mk')
        content = TEMPLATE.format(
            build_type=cfg['build_type'],
            build_tags=cfg['build_tags'],
            build_flavor=cfg['build_flavor'],
            fp_sys=cfg['fingerprint_system'],
            manufacturer=cfg['manufacturer'],
            brand=cfg['brand'],
            model=cfg['model'],
            name=cfg['name'],
            device=cfg['device'],
            fp_vendor=cfg['fingerprint_vendor'],
            vendor_patch=cfg['vendor_security_patch'],
            fp_boot=cfg['fingerprint_bootimage'],
        )
        with open(mk_path, 'w', encoding='utf-8') as wf:
            wf.write(content)
        print(f'Wrote {mk_path}')

if __name__ == '__main__':
    sys.exit(main())

