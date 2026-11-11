"""Monotonic sequential stage timings; no changes to scoring."""
from time import perf_counter

class Timeline:
    def __init__(self):
        self.started=perf_counter();self.last=self.started;self.stages=[]
    def mark(self,name):
        now=perf_counter()
        self.stages.append(dict(name=name,start_ms=(self.last-self.started)*1000,duration_ms=(now-self.last)*1000))
        self.last=now
    def export(self,**metadata):
        return dict(stages=self.stages,total_ms=(perf_counter()-self.started)*1000,**metadata)
