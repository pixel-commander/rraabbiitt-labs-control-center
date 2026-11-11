import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'models/hybrid-seat-ranking'))
from retrieval import run
if __name__=='__main__': run('feedback')
