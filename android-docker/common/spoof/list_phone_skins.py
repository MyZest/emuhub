#!/usr/bin/env python3
import os
import json

HERE = os.path.dirname(os.path.abspath(__file__))
SKINS_DIR = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'emulator-configuration', 'skins'))
OUT = os.path.join(HERE, 'skins_phones.json')

def is_phone(name):
    n = name.lower()
    if n.startswith('tv_') or n.startswith('wearos_') or n.startswith('automotive_'):
        return False
    tablets = {
        'nexus_7','nexus_7_2013','nexus_9','nexus_10','pixel_c','pixel_tablet'
    }
    if n in tablets:
        return False
    return True

def list_dirs(path):
    try:
        return sorted([d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))])
    except Exception:
        return []

def main():
    names = list_dirs(SKINS_DIR)
    phones = [n for n in names if is_phone(n)]
    data = {
        'root': SKINS_DIR,
        'total': len(names),
        'phones_count': len(phones),
        'phones': phones,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print('\n'.join(phones))

if __name__ == '__main__':
    main()
