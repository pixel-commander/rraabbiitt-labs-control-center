"""Optional full-parameter 2D loss slice. Never updates the trained weights."""
import hashlib
import json
import math
import torch


class LandscapeRecorder:
    def __init__(self, model, measure, probe):
        self.model = model
        self.measure = measure
        self.probe = probe
        self.base = self.vector()
        self.axes = []
        self.axis_labels = []
        self.points = [dict(step=0, epoch=0, x=0., y=0., loss=self.loss(), residual=0.)]

    def vector(self):
        return torch.nn.utils.parameters_to_vector(self.model.parameters()).detach().clone()

    def loss(self):
        training = self.model.training
        try:
            self.model.eval()
            with torch.no_grad():
                value = float(self.measure())
            if not math.isfinite(value):
                raise ValueError('Non-finite landscape loss')
            return value
        finally:
            self.model.train(training)

    def record(self, step, epoch):
        delta = self.vector() - self.base
        remainder = delta.clone()
        for axis in self.axes:
            remainder -= torch.dot(remainder, axis) * axis
        norm = float(torch.linalg.vector_norm(remainder))
        if len(self.axes) < 2 and norm > 1e-8:
            self.axes.append(remainder / norm)
            self.axis_labels.append(f'Update direction from step {step}')
        coords = [float(torch.dot(delta, a)) for a in self.axes]
        residual = delta.clone()
        for coordinate, axis in zip(coords, self.axes):
            residual -= coordinate * axis
        self.points.append(dict(step=step, epoch=epoch, x=coords[0] if coords else 0.,
            y=coords[1] if len(coords)>1 else 0., loss=self.loss(),
            residual=float(torch.linalg.vector_norm(residual))))

    def sample(self, progress=lambda done, total: None, grid_size=9):
        if grid_size < 3 or grid_size > 25:
            raise ValueError('Landscape grid_size must be 3–25')
        saved = self.vector()
        generator = torch.Generator(device=self.base.device).manual_seed(42)
        while len(self.axes)<2:
            axis = torch.randn(self.base.shape, generator=generator, device=self.base.device)
            for previous in self.axes:
                axis -= torch.dot(axis, previous) * previous
            norm = torch.linalg.vector_norm(axis)
            if float(norm)<1e-8:
                raise ValueError('Landscape requires at least two independent parameters')
            self.axes.append(axis/norm)
            self.axis_labels.append('Seeded orthogonal direction (no independent update)')
        def extent(key):
            values = [p[key] for p in self.points]
            low, high = min(values), max(values)
            span = max(high-low, max(abs(p['x']) for p in self.points)*.2, .001)
            return torch.linspace(low-span*.3, high+span*.3, grid_size).tolist()
        xs, ys = extent('x'), extent('y')
        losses = []
        try:
            for y in ys:
                row = []
                for x in xs:
                    with torch.no_grad():
                        torch.nn.utils.vector_to_parameters(self.base+x*self.axes[0]+y*self.axes[1], self.model.parameters())
                    row.append(self.loss())
                    progress(len(losses)*grid_size+len(row), grid_size**2)
                losses.append(row)
        finally:
            with torch.no_grad():
                torch.nn.utils.vector_to_parameters(saved, self.model.parameters())
        if not torch.equal(saved, self.vector()):
            raise RuntimeError('Landscape did not restore trained weights exactly')
        return dict(schema=1, method='Full-parameter orthonormal slice through initial weights',
            axes=self.axis_labels, xs=xs, ys=ys, losses=losses, points=self.points,
            probe=self.probe, probe_sha256=hashlib.sha256(json.dumps(self.probe,sort_keys=True).encode()).hexdigest(),
            probe_count=len(self.probe), weights_restored=True,
            loss='Mean binary cross-entropy with logits, fixed training probe, evaluation mode',
            note='Trajectory height is measured at actual weights; its horizontal position is projected. It may leave the slice. This view does not establish convergence or search quality.')
