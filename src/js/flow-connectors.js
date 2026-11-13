// Connector drawing and physics ported from flow-maker/maker.js.
export const straightPath = (from, to) => [from, to];

export const orthoPath = (from, to) => {
  const mid = (from.x + to.x) / 2;
  return [from, { x: mid, y: from.y }, { x: mid, y: to.y }, to];
};

export const curvePath = (from, to) => {
  const mid = (from.x + to.x) / 2;
  const cubic = (t, a, b, c, d) =>
    (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
  return Array.from({ length: 21 }, (_, index) => {
    const t = index / 20;
    return { x: cubic(t, from.x, mid, mid, to.x), y: cubic(t, from.y, from.y, to.y, to.y) };
  });
};

export const createFlowConnectors = (ctx, css) => {
  let tick = 0;
  /* ── ELASTIC: A REAL SPRING, NOT A WOBBLE ─────────────────────────────────
     A sine wave that happens to move looks fake instantly, because it has no
     MEMORY -- it does not care where the wire was a moment ago, so it cannot
     overshoot, settle or sag. This is a chain of point masses with springs
     between them, integrated every frame: verlet-ish, one pass, cheap.

     WHAT MAKES IT READ AS PHYSICAL:
       GRAVITY      the middle sags. A wire between two points is not a
                    straight line in the real world and the eye knows it.
       STIFFNESS    how hard each segment pulls back to its rest length --
                    this is the "elastic" feel, and it is the one number worth
                    tuning by eye.
       DAMPING      energy leaves the system, so a yanked wire SETTLES rather
                    than ringing forever. Without it the thing never stops.
       PINNED ENDS  the two endpoints are held at the cards. Everything
                    between them is free, which is why moving a card whips it.

     THE STATE LIVES PER EDGE, keyed by id, and is created lazily -- so a wire
     that is never elastic costs nothing and one that becomes elastic starts
     from where its straight line was rather than snapping into existence. */
  const springs = new Map();
  // MORE SEGMENTS = A SMOOTHER SAG. 14 was visibly a chain of straight bits
  // at the bottom of the curve; 34 reads as a continuous cable. It costs a
  // handful of extra distance calculations per frame, which is nothing next to
  // how much more real it looks.
  const SEGMENTS = 34;

  function elasticPath(e, x1, y1, x2, y2, peek) {
    let s = springs.get(e.id);
    // REBUILD IF THE SEGMENT COUNT EVER CHANGES, and seed the chain along the
    // straight line so a new wire does not fall out of the sky.
    if (!s || s.pts.length !== SEGMENTS + 1) {
      s = { pts: [], prev: [] };
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const p = { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
        s.pts.push(p);
        s.prev.push({ ...p });
      }
      springs.set(e.id, s);
    }

    // PEEKING RETURNS THE CURRENT SHAPE AND STOPS. No integration, no
    // constraint passes -- the wire is exactly where the last rendered frame
    // left it.
    if (peek) return s.pts.map((q) => ({ x: q.x, y: q.y }));

    const GRAVITY = e.routeSettings?.gravity ?? 0.30;
    const DAMP = e.routeSettings?.damping ?? 0.90;        // <1 or it never settles. Higher = more swing.
    const STIFF = 0.60;       // how hard a segment pulls back to rest length

    // SLACK IS WHAT MAKES IT A CABLE. Rest length slightly LONGER than the gap
    // means the wire has more length than the distance it spans -- so it hangs
    // in a catenary instead of pulling taut into a straight line. A real cable
    // between two points is never tight, and the eye reads a taut line as a
    // stick rather than a wire.
    //
    // IT IS DECLARED ABOVE `rest`, WHICH IS THE WHOLE POINT OF THIS ORDER. A
    // const is in the temporal dead zone until its own line, so using it one
    // line earlier throws EVERY FRAME -- and inside a rAF loop that is a
    // console filling at 60fps with the board frozen behind it.
    const SLACK = e.routeSettings?.slack ?? 1.06;

    const rest = (Math.hypot(x2 - x1, y2 - y1) / SEGMENTS) * SLACK;

    // VERLET: the new position is where it was, plus how far it moved last
    // frame (damped), plus gravity. Velocity is IMPLIED by the two positions,
    // which is what makes this stable when a card is yanked hard.
    for (let i = 1; i < s.pts.length - 1; i++) {
      const p = s.pts[i], q = s.prev[i];
      const vx = (p.x - q.x) * DAMP, vy = (p.y - q.y) * DAMP;
      s.prev[i] = { x: p.x, y: p.y };
      p.x += vx;
      p.y += vy + GRAVITY;
    }

    // THE ENDS ARE PINNED TO THE CARDS, every frame, before the constraints
    // run -- so dragging a card is what injects energy into the chain.
    s.pts[0] = { x: x1, y: y1 };
    s.prev[0] = { x: x1, y: y1 };
    s.pts[SEGMENTS] = { x: x2, y: y2 };
    s.prev[SEGMENTS] = { x: x2, y: y2 };

    // SATISFY THE SPRINGS. Several passes, because fixing one segment breaks
    // its neighbour -- iterating converges on a shape where all of them are
    // near their rest length. Three is enough to look right and cheap enough
    // to run on every wire, every frame.
    // MORE PASSES WITH MORE SEGMENTS. Each pass propagates a correction one
    // segment further along the chain, so a longer chain needs more of them or
    // the far end lags behind the near end and the cable looks rubbery in a
    // way real cable is not.
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < s.pts.length - 1; i++) {
        const a = s.pts[i], b = s.pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = ((d - rest) / d) * 0.5 * STIFF;
        const ox = dx * diff, oy = dy * diff;
        if (i > 0) { a.x += ox; a.y += oy; }
        if (i + 1 < SEGMENTS) { b.x -= ox; b.y -= oy; }
      }
    }
    return s.pts.map((p) => ({ x: p.x, y: p.y }));
  }

  /* ── LIGHTNING: MIDPOINT DISPLACEMENT, THE WAY REAL BOLTS ARE MADE ────────
     NOT a jagged line. A bolt is built by RECURSIVE SUBDIVISION: take a
     segment, push its midpoint sideways by a random amount, then do the same
     to each half with HALF the amount. That self-similarity is why real
     lightning looks the same zoomed in as zoomed out, and why a hand-drawn
     zigzag never convinces -- a zigzag has one scale, a bolt has all of them.

     THE OFFSET SHRINKS WITH THE SEGMENT, which is the whole trick: big kinks
     early, fine detail late, and the eye reads fractal rather than noise.

     BRANCHES FORK AND DIE. A real bolt throws off shorter, dimmer limbs that
     stop in mid-air -- they are stepped leaders that never found ground. They
     inherit the parent's direction with a wide random deviation, and get a
     fraction of its length and brightness. Without them a bolt reads as a
     crack in glass; with them it reads as electricity.

     IT IS RESEEDED ON A TIMER, NOT EVERY FRAME. Real lightning holds a shape
     for a moment and then strikes again somewhere near. Regenerating at 60fps
     is a strobe, and strobing is what makes cheap lightning effects look
     cheap. */
  const bolts = new Map();

  function makeBolt(x1, y1, x2, y2, chaos, depth) {
    // THE SPINE, by midpoint displacement.
    let pts = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    const len = Math.hypot(x2 - x1, y2 - y1);
    let offset = len * chaos;

    for (let pass = 0; pass < 5; pass++) {
      const next = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        // PUSHED PERPENDICULAR to the segment, so a kink is always across the
        // bolt's direction of travel rather than along it.
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const push = (Math.random() - 0.5) * offset;
        next.push({ x: mx + (-dy / d) * push, y: my + (dx / d) * push });
        next.push(b);
      }
      pts = next;
      offset *= 0.55;     // HALVE THE CHAOS EACH PASS -- the self-similarity
    }

    /* THE BRANCHES. Two types, and having both is what makes it read as real
       lightning rather than a fork diagram:

         FINGERS   short limbs that go off and DIE in mid-air. Stepped leaders
                   that never found ground. Most branches are these.
         ARCS      limbs that leave the spine and COME BACK to it further
                   along, closing a loop. Real discharge does this constantly
                   -- the channel splits around a pocket of air and rejoins.
                   Without them a bolt looks like a river delta; with them it
                   looks electric.

       THE SIZES VARY WIDELY ON PURPOSE. Uniform branches read as decoration.
       A few long ones and a lot of tiny ones is what the eye expects, so the
       reach is squared -- which clusters most of them small and lets the
       occasional one run long. */
    const branches = [];
    if (depth > 0) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < count; b++) {
        const at = 0.15 + Math.random() * 0.65;
        const i = Math.floor(pts.length * at);
        const from = pts[i];
        if (!from) continue;

        // ONE IN THREE ARCS BACK. Any more and the bolt turns into a net.
        const arcs = Math.random() < 0.34 && i < pts.length - 8;
        if (arcs) {
          // LAND BACK ON THE SPINE further along, so the loop actually closes
          // on a real point of the bolt rather than near it.
          const j = Math.min(pts.length - 1, i + 6 + Math.floor(Math.random() * 10));
          const back = pts[j];
          if (!back) continue;
          branches.push({
            arc: true,
            pts: makeBolt(from.x, from.y, back.x, back.y, chaos * 2.2, 0).pts,
          });
          continue;
        }

        // A FINGER. squared random => mostly small, occasionally long.
        const r = Math.random();
        const reach = len * (0.05 + r * r * 0.3);
        const ang = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 2.2;
        branches.push({
          pts: makeBolt(from.x, from.y,
                        from.x + Math.cos(ang) * reach,
                        from.y + Math.sin(ang) * reach,
                        chaos * 1.5, depth - 1).pts,
        });
      }
    }
    return { pts, branches };
  }

  function drawBolt(e, x1, y1, x2, y2, color) {
    let b = bolts.get(e.id);
    // HOLD A SHAPE, THEN STRIKE AGAIN. ~7 frames of the same bolt reads as a
    // discharge; a new one every frame reads as television static.
    if (!b || tick - b.born > (e.routeSettings?.flicker ?? 6) * (1 + Math.random())
           || Math.hypot(b.x1 - x1, b.y1 - y1) > 2
           || Math.hypot(b.x2 - x2, b.y2 - y2) > 2) {
      b = { ...makeBolt(x1, y1, x2, y2, e.routeSettings?.chaos ?? 0.16, e.routeSettings?.branches ?? 2), born: tick, x1, y1, x2, y2 };
      bolts.set(e.id, b);
    }

    const stroke = (pts, width, alpha, blur) => {
      if (pts.length < 2) return;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.shadowBlur = blur * (e.routeSettings?.glow ?? 1);
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;

    /* THREE PASSES IS WHAT MAKES IT GLOW. One stroke is a coloured line; the
       glow comes from stacking a wide faint halo, a mid core and a thin hot
       centre. The centre goes to the INK colour rather than white so it stays
       right on a light theme -- a white-hot core on a white page is invisible. */
    stroke(b.pts, 7, 0.10, 18);                      // the halo
    stroke(b.pts, 2.4, 0.45, 10);                    // the body
    ctx.strokeStyle = css('--ink');
    stroke(b.pts, 0.9, 0.95, 6);                     // the hot centre

    // THE BRANCHES, dimmer and thinner the further they fork -- they are
    // leaders that never found ground, so they must never outshine the spine.
    ctx.strokeStyle = color;
    b.branches.forEach((br) => {
      // AN ARC IS PART OF THE CHANNEL, so it carries nearly the spine's
      // brightness. A finger is a dead end and stays dim -- that difference is
      // what stops the whole thing reading as uniform noise.
      if (br.arc) {
        stroke(br.pts, 5, 0.09, 14);
        stroke(br.pts, 1.8, 0.40, 8);
        ctx.strokeStyle = css('--ink');
        stroke(br.pts, 0.7, 0.7, 5);
        ctx.strokeStyle = color;
      } else {
        stroke(br.pts, 3, 0.07, 10);
        stroke(br.pts, 1.0, 0.26, 5);
      }
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ── A CABLE, NOT A LINE ──────────────────────────────────────────────────
     A single stroke is flat however thick you make it. What makes something
     read as ROUND is lighting: it is darker where it curves away from the
     light and brighter where it faces it, and the eye does the rest.

     FOUR PASSES, painted bottom to top:
       CONTACT SHADOW  offset DOWN, blurred, dark -- the cable casts onto the
                       board, which is what lifts it off the surface
       THE UNDERSIDE   the full width, darkest -- the shaded half
       THE BODY        slightly thinner, the wire's own colour
       THE HIGHLIGHT   thin, offset UP toward the light, brightest -- the
                       specular line along the top of a round object

     THE LIGHT COMES FROM ABOVE, which is the only convention that reads as
     natural because it is where the sun is. Every offset below is in that one
     direction and they must stay consistent, or the cable looks like it is lit
     from two places at once. */
  function drawCable(pts, color, weight) {
    const line = (w, alpha, dy, comp) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (comp) ctx.globalCompositeOperation = comp;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y + dy);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y + dy));
      ctx.stroke();
      ctx.restore();
    };

    // +20% (his call 2026-07-26). Everything below is derived from this one
    // number -- the shadow, the underside, the body and the highlight are all
    // multiples of it -- so the whole cable thickens together and stays lit
    // correctly instead of the highlight sliding off a wider tube.
    const w = Math.max(3, (weight + 1.5) * 1.2);

    // THE CONTACT SHADOW. Not a glow around the wire -- a shadow BELOW it, on
    // the board, which is what says the cable is in front of the background
    // rather than drawn onto it.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = css('--shade') || 'rgba(0,0,0,0.4)';
    ctx.lineWidth = w * 1.3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.filter = 'blur(2px)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + 3.5);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y + 3.5));
    ctx.stroke();
    ctx.restore();

    // THE UNDERSIDE -- darkened by laying the ink colour over the wire's own,
    // so it reads as the SAME cable in shadow rather than a second grey line.
    line(w, 0.9, 0.6);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = css('--board');
    ctx.lineWidth = w;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + 0.9);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y + 0.9));
    ctx.stroke();
    ctx.restore();

    // THE BODY, at full colour.
    line(w * 0.72, 1, 0);

    // THE SPECULAR HIGHLIGHT -- thin, offset UP, and in the INK colour rather
    // than white so it stays right on a light theme. This one line is what
    // turns a stripe into a tube.
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = css('--ink');
    ctx.lineWidth = Math.max(0.7, w * 0.2);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - w * 0.22);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y - w * 0.22));
    ctx.stroke();
    ctx.restore();
  }

  function drawFx(e, pts, color, time = tick) {
    // cumulative length, so a charge moves at a constant speed whatever shape
    // the route is -- otherwise it races short legs and crawls long ones.
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segs.push({ a: pts[i], b: pts[i + 1], d, at: total });
      total += d;
    }
    if (!total) return;
    const at = (dist) => {
      const s = segs.find((s) => dist >= s.at && dist <= s.at + s.d) || segs[segs.length - 1];
      const t = (dist - s.at) / (s.d || 1);
      return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
    };

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;

    const settings = e.effectSettings ?? {};
    if (e.fx === 'pulse') {
      // ONE DOT, TRAVELLING. The quietest of the four -- it says "something
      // goes this way" without implying volume.
      const p = at(((time * (settings.speed ?? 1.6)) % 100) / 100 * total);
      ctx.shadowBlur = settings.glow ?? 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, settings.radius ?? 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.fx === 'flow') {
      // A DASH STREAM. Reads as continuous throughput rather than one event.
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = settings.width ?? 2;
      ctx.setLineDash([settings.dash ?? 7, settings.spacing ?? 9]);
      ctx.lineDashOffset = -time * (settings.speed ?? 1.4);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (e.fx === 'crackle') {
      /* A JACOB'S LADDER, RUNNING THREE AT ONCE (his call 2026-07-26).

         ONE arc reads as an animation -- you see the loop. THREE, staggered a
         third of a cycle apart, read as a DISCHARGE: while one is breaking at
         the top another is striking at the bottom, so there is never a moment
         with nothing happening and never an obvious restart.

         EACH ARC IS A LIFECYCLE:
           STRIKE   short and bright at the narrow gap near the start
           CLIMB    hot air rises and drags it along the wire
           STRETCH  a longer arc is higher resistance -- it wanders more,
                    bows further off the wire, and DIMS as it is drawn out
           BREAK    it cannot hold the length, snaps, and restarts below

         THE BOW IS THE ARC. It was nearly a straight slice before; now the
         middle is pushed PERPENDICULAR off the wire, growing with the stretch,
         so it visibly arcs away rather than just wobbling along the line.

         SPARKS FLY OFF THE HEAD. Short-lived fragments thrown from the leading
         edge, falling as they go. Real discharge sheds material; without them
         the arcs look drawn rather than burnt. */
      const CYCLE = settings.cycle ?? 78;
      const ARCS = settings.arcs ?? 3;
      const seed = String(e.id ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      for (let n = 0; n < ARCS; n++) {
        // STAGGERED BY A THIRD OF A CYCLE EACH, plus a per-wire offset so two
        // wires on screen are never in lockstep.
        const phase = ((time + seed * 11 + n * (CYCLE / ARCS)) % CYCLE) / CYCLE;

        const climb = 0.06 + phase * 0.88;
        const span = total * (0.06 + phase * 0.26);
        const head = total * climb;
        const tail = Math.max(0, head - span);

        const a = at(tail), b2 = at(head);

        // THE BOW -- the middle pushed perpendicular to the wire. THIS is what
        // makes it an arc instead of a jagged line lying along the cable, and
        // it grows as the arc stretches because a longer channel bows further.
        const dx = b2.x - a.x, dy = b2.y - a.y;
        const L = Math.hypot(dx, dy) || 1;
        // ALTERNATING SIDES per arc, so three at once do not stack into one
        // fat band -- they read as separate discharges finding separate paths.
        const side = n % 2 ? 1 : -1;
        const bow = (8 + phase * 26) * side;
        const mid = {
          x: (a.x + b2.x) / 2 + (-dy / L) * bow,
          y: (a.y + b2.y) / 2 + (dx / L) * bow,
        };

        const wander = 0.10 + phase * 0.16;

        /* HELD FOR A FEW FRAMES, NOT REGENERATED EVERY ONE. Two reasons, and
           the first is the important one:

           IT LOOKS RIGHT. A bolt that reshuffles 60 times a second is static;
           real discharge holds a channel for a moment, then re-strikes near
           it. The same rule the `lightning` wire type already follows.

           AND IT IS CHEAPER. Six makeBolt calls per wire per frame is ~800
           points regenerated 60 times a second, for a shape the eye cannot
           follow at that rate anyway. Holding for 4 frames cuts it by three
           quarters and looks BETTER, which is the good type of optimisation.

           The key includes the arc index, so the three do not re-strike in
           unison -- that would read as one flicker rather than three arcs. */
        const key = `${e.id}:${n}`;
        let held = bolts.get(key);
        if (!held || time - held.born > 3 + (n % 3)) {
          held = {
            born: time,
            h1: makeBolt(a.x, a.y, mid.x, mid.y, wander, 1),
            h2: makeBolt(mid.x, mid.y, b2.x, b2.y, wander, 1),
          };
          bolts.set(key, held);
        }
        const h1 = held.h1, h2 = held.h2;

        // DIMS AS IT STRETCHES, and fades to nothing at the break so the end
        // of a cycle is a fade rather than a cut.
        const life = Math.max(0, 1 - phase * 0.85);

        const paint = (pts, w, alpha, blur, col) => {
          if (pts.length < 2) return;
          ctx.strokeStyle = col;
          ctx.globalAlpha = alpha * life;
          ctx.lineWidth = w;
          ctx.shadowBlur = blur;
          ctx.shadowColor = color;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          pts.slice(1).forEach((q) => ctx.lineTo(q.x, q.y));
          ctx.stroke();
        };

        // THE THREE-PASS GLOW, same as the bolt wire type -- halo, body, hot
        // centre -- so the effect and the wire look like one phenomenon.
        [h1, h2].forEach((half) => {
          paint(half.pts, 8, 0.09, 18, color);
          paint(half.pts, 2.2, 0.45, 11, color);
          paint(half.pts, 0.8, 0.9, 6, css('--ink'));
          half.branches.forEach((br) => paint(br.pts, 0.9, 0.2, 5, color));
        });

        // THE SPARKS. Thrown from the leading edge, falling as they age, and
        // seeded off the arc index so each one sheds its own.
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        for (let k = 0; k < 4; k++) {
          const age = ((time * 0.9 + k * 17 + n * 29) % 30) / 30;
          if (age > 0.85) continue;
          const ang = (k * 2.399 + n * 1.7 + seed) % (Math.PI * 2);
          const reach = age * 22;
          const sx = b2.x + Math.cos(ang) * reach;
          // GRAVITY ON THE SPARK -- it arcs downward as it flies, which is the
          // difference between a spark and a dot moving in a straight line.
          const sy = b2.y + Math.sin(ang) * reach + age * age * 16;
          ctx.globalAlpha = Math.min(1, (1 - age) * 0.9 * life * (settings.sparks ?? 1));
          ctx.fillStyle = k % 2 ? css('--ink') : color;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, 1.6 * (1 - age)), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  return {
    step: () => { tick += 1; },
    elasticPath,
    makeBolt,
    drawBolt,
    drawCable,
    drawFx,
  };
};
