import { createFlowConnectors, curvePath, orthoPath, straightPath } from "./flow-connectors.js";

// Canvas drawing and hit testing ported from flow-maker/maker.js.
export const createFlowRenderer = (cv) => {
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  let palette;
  const css = (name) => palette.getPropertyValue(name).trim();
  const connectors = createFlowConnectors(ctx, css);
  const { elasticPath, drawBolt, drawCable, drawFx } = connectors;
  const NODE_W = 190;
  const NODE_H = 56;
  let FLOW, selected, view;
  const boxOf = (n) => ({ x: n.x, y: n.y, w: n.w ?? NODE_W, h: n.h ?? NODE_H });
  const inBox = (b, p) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

  const nodeAt = (p) => [...FLOW.nodes].reverse().find((n) => inBox(boxOf(n), p)) || null;

  // THE RESIZE GRIP -- the bottom-right corner of a card. 14px, which is small
  // enough not to steal ordinary drags and big enough to hit at 50% zoom.
  const GRIP = 14;
  const gripAt = (p) => [...FLOW.nodes].reverse().find((n) => {
    const b = boxOf(n);
    return p.x >= b.x + b.w - GRIP && p.x <= b.x + b.w
        && p.y >= b.y + b.h - GRIP && p.y <= b.y + b.h;
  }) || null;
  // A CIRCLE IS SELECTED BY ITS RIM, not its middle -- the inside of a ring is
  // where the cards it is ringing live, so a solid hit area would steal every
  // click meant for them.
  const shapeAt = (p) => [...FLOW.shapes].reverse().find((s) => {
    const d = Math.hypot(p.x - s.x, p.y - s.y);
    return d <= s.r + 8 && d >= s.r - 12;
  }) || null;

  // AND RESIZED BY ITS RIM TOO. A circle has no corner to grip, so the rim
  // does both jobs: the OUTER half of the band resizes, the inner half moves.
  // That matches how it reads -- push the edge outward and it grows.
  const shapeRimAt = (p) => [...FLOW.shapes].reverse().find((s) => {
    const d = Math.hypot(p.x - s.x, p.y - s.y);
    return d <= s.r + 8 && d >= s.r - 2;
  }) || null;
  const noteAt = (p) => [...FLOW.notes].reverse().find((n) =>
    p.x >= n.x - 4 && p.x <= n.x + 180 && p.y >= n.y - 14 && p.y <= n.y + 6) || null;

  // DISTANCE FROM A POINT TO A SEGMENT. The clamp on t is what makes it a
  // SEGMENT and not an infinite line -- without it, a click far past the end
  // of a short wire still measures as "on" it.
  const distToSeg = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };

  // WHICH WIRE IS UNDER THE POINTER -- tested against the PATH IT ACTUALLY
  // DRAWS, every segment of it.
  //
  // IT USED TO TEST A STRAIGHT LINE between the two cards, whatever route the
  // wire took. That was wrong for ortho from the start -- an ortho wire goes
  // out, across and in, so most of it is nowhere near that diagonal, and you
  // had to click the empty middle of the board to select it. Adding elastic
  // and bolt only made an existing bug visible: a sagging cable is even
  // further from the line, so clicking stopped working entirely.
  //
  // pathOf IS THE ONE SOURCE. The drawing and the hit test now walk the same
  // points, so they cannot disagree about where a wire is -- which is the only
  // way this stays true when a sixth route is added.
  const edgeAt = (p) => FLOW.edges.find((e) => {
    const pts = pathOf(e, true);   // PEEK -- never step physics from a click
    if (pts.length < 2) return false;
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSeg(p, pts[i], pts[i + 1]) < 10) return true;
    }
    return false;
  }) || null;

  const colorOf = (e) => e?.color ? (e.color.startsWith('--') ? css(e.color) : e.color)
                                  : css(FLOW.types[e?.type]?.color || '--dim');

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // THE WIRE'S PATH, as points. ONE function for all three routes so the
  // drawing, the effect and the hit test can never disagree about where a
  // wire actually is.
  // peek=true MEANS "TELL ME WHERE IT IS, DO NOT MOVE IT". The hit test needs
  // the wire's shape, and for an elastic wire computing that shape ADVANCES
  // THE SIMULATION -- so a click would nudge the spring an extra step and a
  // rapid click would visibly shake the cable. Only the render loop is allowed
  // to step physics.
  function pathOf(e, peek) {
    const a = FLOW.nodes.find((n) => n.id === e.from);
    const b = FLOW.nodes.find((n) => n.id === e.to);
    if (!a || !b) return [];
    const A = boxOf(a), B = boxOf(b);
    const x1 = A.x + A.w, y1 = A.y + A.h / 2;
    const x2 = B.x, y2 = B.y + B.h / 2;
    const from = { x: x1, y: y1 };
    const to = { x: x2, y: y2 };
    if (e.route === 'elastic') return elasticPath(e, x1, y1, x2, y2, peek);
    if (e.route === 'curve') return curvePath(from, to);
    if (e.route === 'straight' || e.route === 'bolt') return straightPath(from, to);
    return orthoPath(from, to);
  }

  const warned = new Set();   // report a draw failure once, not 60x a second

  function drawEdge(e) {
    const pts = pathOf(e);
    if (pts.length < 2) return;
    const k = FLOW.types[e.type ?? e.kind] || {};
    const color = colorOf(e);
    const on = selected?.type === 'edge' && selected.id === (e.id ?? FLOW.edges.indexOf(e));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = (k.weight || 1.5) + (on ? 1 : 0);
    ctx.globalAlpha = k.mute ? 0.5 : 0.95;
    ctx.setLineDash(k.dash || []);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // THE BOLT DRAWS ITSELF and replaces the plain stroke entirely -- it has
    // its own three-pass glow, so laying a flat line under it would show as a
    // dead straight ghost running through the middle of the discharge.
    if (e.route === 'bolt') {
      drawBolt(e, pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y, color);
    } else {
      if (e.route === 'elastic') {
        drawCable(pts, color, (k.weight || 1.5) + (on ? 1 : 0));
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // THE EFFECT IS PER-WIRE (his call 2026-07-26), not per-chart. Each one
    // walks the SAME path the wire drew, so it can never run beside its line.
    if (e.fx && e.fx !== 'none') drawFx(e, pts, color);

    // THE ARROWHEAD, aimed along the last segment -- so it points the way the
    // wire actually arrives rather than always pointing right.
    const p1 = pts[pts.length - 1], p0 = pts[pts.length - 2];
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x - 9 * Math.cos(ang - 0.4), p1.y - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(p1.x - 9 * Math.cos(ang + 0.4), p1.y - 9 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // GUARD THE MIDPOINT. A short or empty path has no middle, and reading
    // .x off undefined throws INSIDE THE RENDER LOOP -- which does not break
    // one edge, it kills every frame after it and the whole board goes blank
    // with one error in the console. One bad edge must never cost the canvas.
    const m = pts[Math.floor(pts.length / 2)];
    if (e.label && m) {
      ctx.font = '600 10px ' + css('--mono');
      const w = ctx.measureText(e.label)?.width || 0;
      ctx.fillStyle = css('--board');
      ctx.fillRect(m.x - w / 2 - 4, m.y - 7, w + 8, 14);
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(e.label, m.x - w / 2, m.y);
    }
  }

  /* THE FOUR CONNECTOR EFFECTS. Each is a different ANSWER to "what is moving
     along this wire", and they are per-edge so one diagram can say several
     things at once -- a live feed, a slow poll, a dangerous path. */
  function drawNode(n) {
    const b = boxOf(n);
    const on = selected?.type === 'node' && selected.id === n.id;
    const accent = css(FLOW.types[n.type ?? n.kind]?.color || '--dim');

    /* THE CARD IS LIT, NOT DROP-SHADOWED. A single blurred grey rectangle
       under a box is the 2009 look -- it says "this is floating" and nothing
       else. What reads as MODERN and three-dimensional is a stack:

         AMBIENT OCCLUSION   tight, dark, barely offset -- the contact shadow
                             where the card meets the board. This is the one
                             that does the work; without it a card looks
                             pasted on however soft the big shadow is.
         THE CAST SHADOW     wide, soft, offset further down. Light from above.
         THE TOP BEVEL       a bright hairline along the top edge, catching the
                             light -- the edge facing the source.
         THE BOTTOM BEVEL    a dark hairline along the bottom -- the edge
                             turning away from it.

       TWO SHADOWS AT DIFFERENT SCALES is the whole trick, and it is how real
       light behaves: a hard near shadow and a soft far one. One blur can only
       ever be a compromise between them.

       EVERY OFFSET IS DOWNWARD, because the light is above -- the same
       direction the cable's highlight uses, so the whole board is lit from one
       place. */
    ctx.save();

    // 1. THE CAST SHADOW -- soft, far, offset well down.
    ctx.shadowColor = css('--shade') || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = on ? 26 : 14;
    ctx.shadowOffsetY = on ? 10 : 6;
    ctx.fillStyle = css('--card');
    roundRect(b.x, b.y, b.w, b.h, 6);
    ctx.fill();

    // 2. THE AMBIENT OCCLUSION -- tight and dark, right at the contact.
    //    Painted as a SECOND fill of the same shape so it lands exactly on
    //    the card's own edge rather than around it.
    ctx.shadowBlur = on ? 6 : 4;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.restore();

    // 3. THE BEVELS -- two hairlines, top bright and bottom dark. Clipped to
    //    the card so they follow its rounded corners instead of overshooting.
    ctx.save();
    roundRect(b.x, b.y, b.w, b.h, 6);
    ctx.clip();

    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = css('--ink');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 0.7);
    ctx.lineTo(b.x + b.w, b.y + 0.7);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = css('--board');
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.h - 0.7);
    ctx.lineTo(b.x + b.w, b.y + b.h - 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = css('--line');
    ctx.lineWidth = 1;
    roundRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, 6);
    ctx.stroke();

    /* THE SELECTION RING SITS OUTSIDE THE CARD, not on its edge. A 1.6px line
       drawn ON the border was technically "highlighted" and practically
       invisible -- it competed with the card's own outline and you could not
       tell at a glance which one you had picked.
       OUTSIDE means it changes the card's SILHOUETTE, which the eye catches
       instantly and without having to compare two similar borders.
       DASHED AND OFFSET so it reads as a selection marquee rather than as part
       of the card -- the card is not becoming thicker, it is being pointed at. */
    if (on) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.globalAlpha = 0.9;
      roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 9);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // THE LEFT RAIL CARRIES THE TYPE -- one place colour is spent, so what a
    // node IS reads at a glance instead of from a legend.
    ctx.fillStyle = accent;
    roundRect(b.x, b.y, 3, b.h, 2);
    ctx.fill();

    // TITLE ON TOP, THEN ICON AND BODY SIDE BY SIDE (his call 2026-07-26).
    // The icon sits LEFT OF THE BODY, not left of the whole card -- so the
    // title always starts at the same place whether a card has an icon or not,
    // and a column of cards reads down its titles without a ragged edge.
    //
    // THE TEXT SCALES WITH THE CARD, THE WIRES DO NOT (his call 2026-07-26).
    // Shrink a card and its words shrink with it; the wires keep their weight
    // and the popup keeps its size. That is the honest split: a card's size is
    // saying something about the card, and it should say nothing about the
    // connections between cards or about the tool you edit them with.
    //
    // FLOORED AT 0.7 so a small card is still readable rather than a smudge --
    // past a point, shrinking the text stops carrying meaning and starts
    // hiding it.
    const scale = Math.max(0.7, Math.min(1.35, (b.h / NODE_H + b.w / NODE_W) / 2));
    const pad = 12 * Math.min(1, scale);

    ctx.textBaseline = 'top';
    ctx.fillStyle = n.color ? css(n.color) : css('--ink');
    ctx.font = `600 ${(12 * scale).toFixed(1)}px ` + css('--mono');
    ctx.fillText(n.title || 'untitled', b.x + pad, b.y + 9 * scale);

    const icon = (n.icon || '').trim();
    let body_x = b.x + pad;
    if (icon) {
      ctx.fillStyle = accent;
      ctx.font = `${(13 * scale).toFixed(1)}px ` + css('--mono');
      ctx.fillText(icon, b.x + pad, b.y + 26 * scale);
      // THE BODY STARTS AFTER THE ICON, measured -- not a guessed indent, so
      // a wide glyph and a narrow one both leave the same gap.
      body_x = b.x + pad + ctx.measureText(icon).width + 6 * scale;
    }

    ctx.fillStyle = css('--dim');
    ctx.font = `${(10 * scale).toFixed(1)}px ` + css('--mono');
    (n.sub || '').split('\n').slice(0, 2).forEach((l, i) =>
      ctx.fillText(l, body_x, b.y + 27 * scale + i * 12 * scale));

    // THE GRIP, DRAWN ONLY ON THE SELECTED CARD. Every card showing a handle
    // would be a board covered in furniture; the one you are working on is the
    // only one that needs it.
    if (on) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w - 4, b.y + b.h - 11);
      ctx.lineTo(b.x + b.w - 11, b.y + b.h - 4);
      ctx.moveTo(b.x + b.w - 4, b.y + b.h - 6);
      ctx.lineTo(b.x + b.w - 6, b.y + b.h - 4);
      ctx.stroke();
    }

    // A TOOLTIP MARKER. A card carrying a `plain` sentence says so, or nobody
    // knows to hover it. -> NEXT.txt, tooltips on cards AND shapes
    if (n.plain) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(b.x + b.w - 9, b.y + 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShape(s) {
    const on = selected?.type === 'shape' && selected.id === s.id;
    ctx.save();
    ctx.strokeStyle = css(FLOW.types[s.type]?.color || '--dim');
    ctx.globalAlpha = on ? 0.95 : 0.6;
    ctx.lineWidth = on ? 2 : 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (s.title) {
      ctx.fillStyle = css(FLOW.types[s.type]?.color || '--dim');
      ctx.font = '600 10px ' + css('--mono');
      ctx.textBaseline = 'bottom';
      const w = ctx.measureText(s.title).width;
      ctx.fillText(s.title, s.x - w / 2, s.y - s.r - 6);
    }
    // SAME TOOLTIP MARKER AS A CARD -- a shape is not second-class annotation.
    if (s.plain) {
      ctx.beginPath();
      ctx.arc(s.x + s.r * 0.7, s.y - s.r * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNote(n) {
    const on = selected?.type === 'note' && selected.id === n.id;
    ctx.save();
    ctx.fillStyle = on ? css('--ink') : css('--dim');
    ctx.font = '11px ' + css('--mono');
    ctx.textBaseline = 'alphabetic';
    (n.text || 'note').split('\n').forEach((l, i) => ctx.fillText(l, n.x, n.y + i * 14));
    ctx.restore();
  }

  function render() {
    const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (cv.width !== width) cv.width = width;
    if (cv.height !== height) cv.height = height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = css('--board');
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.z, view.z);

    /* ONE BAD ITEM MUST NOT BLANK THE BOARD. A throw anywhere in here aborts
       the whole frame -- and inside a rAF loop that means every frame after it
       dies too, so the canvas freezes and the console fills at 60fps. That has
       now happened twice in this file: once on an undefined SLACK, once on a
       missing midpoint.
       CAUGHT PER ITEM, so a broken edge costs its own line and nothing else,
       and the error is reported ONCE rather than sixty times a second. */
    const draw = (list, fn, what) => list.forEach((item) => {
      try { fn(item); } catch (err) {
        if (!warned.has(what + item?.id)) {
          warned.add(what + item?.id);
          console.error(`flow-maker: ${what} ${item?.id} failed to draw --`, err);
        }
      }
    });

    draw(FLOW.shapes, drawShape, 'shape');
    draw(FLOW.edges, drawEdge, 'edge');
    draw(FLOW.nodes, drawNode, 'node');
    draw(FLOW.notes, drawNote, 'note');

    ctx.restore();
  }

  const prepare = (data, selection, viewport) => {
    FLOW = { ...data, types: data.types ?? data.kinds ?? {}, shapes: data.shapes ?? [], notes: data.notes ?? [] };
    selected = selection;
    view = viewport;
    palette = getComputedStyle(cv);
  };

  return {
    draw(data, selection, viewport, animate) {
      prepare(data, selection, viewport);
      if (animate) connectors.step();
      render();
    },
    pick(data, point, viewport) {
      prepare(data, null, viewport);
      const grip = gripAt(point);
      if (grip) return { type: 'node', id: grip.id, resize: true };
      const node = nodeAt(point);
      if (node) return { type: 'node', id: node.id };
      const rim = shapeRimAt(point);
      if (rim) return { type: 'shape', id: rim.id, resize: true };
      const shape = shapeAt(point);
      if (shape) return { type: 'shape', id: shape.id };
      const note = noteAt(point);
      if (note) return { type: 'note', id: note.id };
      const edge = edgeAt(point);
      return edge && { type: 'edge', id: edge.id ?? data.edges.indexOf(edge) };
    },
  };
};
