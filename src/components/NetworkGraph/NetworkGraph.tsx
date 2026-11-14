import { useEffect, useRef, useState } from "react";
import type { NetworkGraphProps, GraphNode, GraphEdge } from "./NetworkGraph.types";
import "./css/network-graph.css";
import { createFlowConnectors, curvePath, orthoPath, straightPath } from "../../js/flow-connectors.js";
import { SmartTooltip } from "../SmartTooltip/SmartTooltip";

export const NetworkGraph = ({
  className = "",
  data,
  selected,
  selectedEffect = "crackle",
  handleSelect,
  handleClick,
  colors = {},
  lineStyle = {},
  initialZoom = 1,
  title = "Network graph",
  tooltips = true,
}: NetworkGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{x:number;y:number}|null>(null);
  const tooltipKey = useRef<string|undefined>(undefined);
  const [hoveredKey,setHoveredKey] = useState<string|undefined>(undefined);
  const hoveredNode = data.nodes.find(node=>node.key===hoveredKey);
  const current = useRef({
    data,
    selected,
    selectedEffect,
    handleSelect,
    handleClick,
    colors,
    lineStyle,
  });
  current.current = {
    data,
    selected,
    selectedEffect,
    handleSelect,
    handleClick,
    colors,
    lineStyle,
  };
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let scale = 1,
      offsetX = 0,
      offsetY = 0;
    let hover: GraphNode | undefined;
    let drag:
      | { x: number; y: number; ox: number; oy: number; moved: boolean }
      | undefined;
    let initialized = false;
    const updateTooltip = (node?:GraphNode) => {
      if (tooltipKey.current !== node?.key) {
        tooltipKey.current=node?.key;
        setHoveredKey(node?.key);
      }
    };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, frame = 0;
    let connectorData = current.current.data;
    const token = (name:string) => {
      const skin = getComputedStyle(canvas);
      const mapped = name === '--board' ? '--color-main' : name === '--ink' ? '--color-main-neg' : name === '--shade' ? '--color-main' : name;
      return skin.getPropertyValue(mapped).trim() || skin.color;
    };
    let connectors = createFlowConnectors(ctx, token);
    let effectData = current.current.data;
    let effectKeys = new Set(effectData.nodes.map(node=>node.key));
    const wireEffect = (edge:GraphEdge) => {
      const state=current.current;
      if(effectData!==state.data){effectData=state.data;effectKeys=new Set(effectData.nodes.map(node=>node.key));}
      const pinned=state.selected&&effectKeys.has(state.selected) ? state.selected : undefined;
      const touchesPinned=!!pinned&&(edge.source===pinned||edge.target===pinned);
      const touchesHover=!!hover&&(edge.source===hover.key||edge.target===hover.key);
      if(edge.fx !== undefined) return edge.fxOn==='active'&&!touchesPinned&&!touchesHover ? 'none' : edge.fx;
      return touchesPinned ? state.selectedEffect : 'none';
    };
    const canAnimate = () => !motion.matches && !document.hidden && visible && current.current.data.edges.some(edge =>
      edge.route === 'elastic' || edge.route === 'bolt' ||
      wireEffect(edge) !== 'none',
    );
    const bounds = () => ({
      w: Math.max(400, ...current.current.data.nodes.map((n) => n.x)) + 275,
      h: Math.max(240, ...current.current.data.nodes.map((n) => n.y)) + 70,
    });
    const fit = () => {
      const rect = canvas.getBoundingClientRect(),
        world = bounds();
      scale =
        Math.min((rect.width - 60) / world.w, (rect.height - 60) / world.h) *
        initialZoom;
      offsetX = (rect.width - world.w * scale) / 2;
      offsetY = (rect.height - world.h * scale) / 2;
    };
    const draw = (advance = false) => {
      const { data, selected, colors, lineStyle } = current.current;
      if (data !== connectorData) { connectors = createFlowConnectors(ctx, token); connectorData = data; }
      if (advance) connectors.step();
      const skin = getComputedStyle(canvas);
      const palette = {
        node: skin.getPropertyValue("--network-node").trim() || skin.color,
        edge: skin.getPropertyValue("--network-edge").trim() || skin.color,
        label: skin.getPropertyValue("--network-text").trim() || skin.color,
        guide: skin.getPropertyValue("--network-line").trim() || skin.color,
        ...colors,
      };
      const lines = {
        width: 1,
        opacity: 0.9,
        activeWidth: 1.25,
        activeOpacity: 1,
        inactiveOpacity: 0.025,
        ...lineStyle,
      };
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const byKey = new Map(data.nodes.map((n) => [n.key, n]));
      const focus =
        hover?.key ?? (selected && byKey.has(selected) ? selected : undefined);
      const related = new Set<string>(focus ? [focus] : []);
      if(selected&&byKey.has(selected)) related.add(selected);
      data.edges.forEach((e) => {
        if (e.source === focus) related.add(e.target);
        if (e.target === focus) related.add(e.source);
        if (e.source === selected) related.add(e.target);
        if (e.target === selected) related.add(e.source);
      });
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.strokeStyle = palette.guide;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3 / scale, 8 / scale]);
      ctx.lineWidth = 1 / scale;
      const world = bounds();
      [...new Set(data.nodes.map((n) => n.x))].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 35);
        ctx.lineTo(x, world.h - 35);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      for (const [index, edge] of data.edges.entries()) {
        const a = byKey.get(edge.source),
          b = byKey.get(edge.target);
        if (!a || !b) continue;
        const active =
          (!!focus && (edge.source === focus || edge.target === focus)) ||
          (!!selected && (edge.source === selected || edge.target === selected));
        ctx.globalAlpha = focus
          ? active
            ? lines.activeOpacity
            : lines.inactiveOpacity
          : lines.opacity;
        const color = active
          ? (edge.color ?? b.color ?? palette.edge)
          : (edge.color ?? palette.edge);
        ctx.strokeStyle = color;
        ctx.lineWidth = (active ? lines.activeWidth : lines.width) / scale;
        const wire = { ...edge, id: edge.id ?? `${edge.source}\0${edge.target}\0${index}` };
        const from = {x:a.x,y:a.y}, to = {x:b.x,y:b.y};
        const points = edge.route === 'elastic'
          ? motion.matches ? curvePath(from, to) : connectors.elasticPath(wire,a.x,a.y,b.x,b.y,!advance)
          : edge.route === 'ortho' ? orthoPath(from,to)
          : edge.route === 'straight' || edge.route === 'bolt' ? straightPath(from,to)
          : edge.route === 'curve' ? curvePath(from,to)
          : Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;return{x:u*u*u*a.x+3*u*u*t*(a.x+300)+3*u*t*t*(b.x-300)+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*b.y};});
        if (!edge.route) {
          // Preserve the original NetworkGraph geometry when callers omit routing.
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(a.x+300,a.y,b.x-300,b.y,b.x,b.y);ctx.stroke();
        } else if (edge.route === 'bolt' && !motion.matches && (!focus || active)) {
          connectors.drawBolt(wire,a.x,a.y,b.x,b.y,color);
        } else {
          // Thin polyline uses the shared elastic geometry while retaining this graph's fade and scale.
          ctx.beginPath();points.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.stroke();
        }
        const fx=wireEffect(edge);
        if (!motion.matches && fx !== 'none') {
          connectors.drawFx({...wire,fx},points,color);
        }
      }
      for (const node of data.nodes) {
        const active = !focus || related.has(node.key),
          left = node.group === "components";
        ctx.globalAlpha = active ? 1 : 0.35;
        ctx.fillStyle = node.color ?? palette.node;
        ctx.shadowColor = active ? (node.color ?? palette.node) : "transparent";
        ctx.shadowBlur = active ? 10 : 0;
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          focus && active ? 6.5 : left ? 4.2 : 3.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        if (scale > 0.3 || !!focus && related.has(node.key)) {
          ctx.font = `${Math.max(11, (left ? 12 : 11) / scale)}px Segoe UI`;
          ctx.textAlign = left ? "right" : "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = palette.label;
          ctx.fillText(
            node.name ?? node.key,
            node.x + (left ? -13 : 12),
            node.y,
            260 / scale,
          );
        }
      }
      ctx.restore();
    };
    const syncAnimation = () => {
      if (canAnimate()) { if (!frame) frame = requestAnimationFrame(animate); }
      else { cancelAnimationFrame(frame); frame=0; }
    };
    const animate = () => {frame=0;if(!canAnimate())return;draw(true);syncAnimation();};
    const repaint = () => {draw();syncAnimation();};
    redraw.current = repaint;
    const resize = () => {
      const rect = canvas.getBoundingClientRect(),
        dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!initialized) {
        fit();
        initialized = true;
      }
      repaint();
    };
    const nodeAt = (x: number, y: number) => {
      let best: GraphNode | undefined,
        distance = 14 / scale;
      const wx = (x - offsetX) / scale,
        wy = (y - offsetY) / scale;
      for (const node of current.current.data.nodes) {
        const d = Math.hypot(wx - node.x, wy - node.y);
        if (d < distance) {
          best = node;
          distance = d;
        }
      }
      return best;
    };
    const down = (event: PointerEvent) => {
      pointerRef.current=null;
      updateTooltip();
      drag = {
        x: event.clientX,
        y: event.clientY,
        ox: offsetX,
        oy: offsetY,
        moved: false,
      };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (drag) {
        pointerRef.current=null;
        updateTooltip();
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        offsetX = drag.ox + dx;
        offsetY = drag.oy + dy;
        canvas.style.cursor = "grabbing";
      } else {
        pointerRef.current={x:event.clientX,y:event.clientY};
        hover = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
        updateTooltip(hover);
        canvas.style.cursor = hover ? "pointer" : "grab";
      }
      repaint();
    };
    const up = (event: PointerEvent) => {
      if (drag && !drag.moved) {
        const rect = canvas.getBoundingClientRect(),
          node = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
        current.current.handleSelect?.(node, "network-graph");
        if (node) current.current.handleClick?.(node, "network-graph");
      }
      drag = undefined;
      canvas.style.cursor = "grab";
      repaint();
    };
    const leave = () => {
      pointerRef.current=null;
      updateTooltip();
      hover = undefined;
      repaint();
    };
    const cancel = () => {
      drag = undefined;
      leave();
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top,
        old = scale;
      scale = Math.min(
        3.2,
        Math.max(0.08, scale * Math.exp(-event.deltaY * 0.001)),
      );
      offsetX = x - (x - offsetX) * (scale / old);
      offsetY = y - (y - offsetY) * (scale / old);
      repaint();
    };
    const reset = () => {
      fit();
      repaint();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("dblclick", reset);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(entries => {visible=entries.some(entry=>entry.isIntersecting);syncAnimation();});
    intersection.observe(canvas);
    const theme = new MutationObserver(repaint);
    for (let parent:Element|null=canvas.parentElement;parent;parent=parent.parentElement) theme.observe(parent,{attributes:true,attributeFilter:['data-theme','class','style']});
    document.addEventListener('visibilitychange',syncAnimation);
    motion.addEventListener('change',repaint);
    resize();
    return () => {
      observer.disconnect();
      intersection.disconnect();theme.disconnect();cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange',syncAnimation);
      motion.removeEventListener('change',repaint);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("dblclick", reset);
      redraw.current = () => {};
      pointerRef.current=null;
    };
  }, [initialZoom]);
  useEffect(() => {
    redraw.current();
  }, [data, selected, selectedEffect, colors, lineStyle]);
  return (
    <div className={["network-graph", className].filter(Boolean).join(" ")}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${title}. Drag to pan, scroll to zoom, double-click to reset.`}
      />
      <SmartTooltip targetRef={canvasRef} positionRef={pointerRef}
        disabled={!tooltips||!hoveredNode||!pointerRef.current}
        title={hoveredNode?.title??hoveredNode?.name??hoveredNode?.key}
        container_class="container-main" className="network-graph-tooltip"
        content={hoveredNode&&<>
          {hoveredNode.path&&<code>{hoveredNode.path}</code>}
          {hoveredNode.description&&<p>{hoveredNode.description}</p>}
          {hoveredNode.type&&<small>{hoveredNode.type}</small>}
        </>} />
      {data.nodes.length === 0 && <p>No nodes to display.</p>}
    </div>
  );
};
