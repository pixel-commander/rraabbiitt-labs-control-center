"""Compatibility entry point; implementation owned by retrieval.py and toolkit tools."""
import json
import sys
from retrieval import train, search, run

if __name__ == '__main__':
    if '--train' in sys.argv:
        print(json.dumps(train()))
    else:
        run('search')
