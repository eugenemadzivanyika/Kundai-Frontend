import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Math rendering ───────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMath(text: string): string {
  if (!text) return '';
  // Match $$...$$ (display) before $...$ (inline) to avoid false positives
  const re = /(\$\$[\s\S]*?\$\$|\$(?!\$)[^$\n]*?\$)/g;
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(escapeHtml(text.slice(last, m.index)));
    const raw = m[0];
    const display = raw.startsWith('$$');
    const math = display ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();
    try {
      parts.push(katex.renderToString(math, { displayMode: display, throwOnError: false, output: 'html' }));
    } catch {
      parts.push(escapeHtml(raw));
    }
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  return parts.join('');
}

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ text, className, block }) => {
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderMath(text ?? '') }} />;
};

// ─── Manifest Types ───────────────────────────────────────────────────────────

export type DiagramPoint = { label?: string; x: number; y: number };

export type DiagramLine = {
  x1: number; y1: number; x2: number; y2: number;
  label?: string;
  dashed?: boolean;
};

export type DiagramCircle = {
  cx: number; cy: number; r: number;
  label?: string;
  labelOffset?: { dx?: number; dy?: number };
};

export type DiagramAngleMarker = {
  cx: number; cy: number; r: number;
  startAngle: number; // degrees, 0 = east, clockwise (SVG convention)
  endAngle: number;
  label?: string;
};

export type DiagramAxis = {
  label: string;
  min: number;
  max: number;
  ticks?: number[];
};

export type DiagramManifest = {
  type:
    | 'Circle_Geometry'
    | 'Triangle_Geometry'
    | 'Velocity_Time_Graph'
    | 'Construction_Loci'
    | 'Bar_Chart'
    | 'Number_Line'
    | 'Coordinate_Plane'
    | 'Generic';
  viewBox?: string;
  circles?: DiagramCircle[];
  points?: DiagramPoint[];
  lines?: DiagramLine[];
  angleMarkers?: DiagramAngleMarker[];
  // Graph / chart types
  axes?: { x: DiagramAxis; y: DiagramAxis };
  dataPoints?: Array<{ x: number; y: number }>;
  bars?: Array<{ label: string; value: number }>;
  numberLineRange?: { min: number; max: number; marked?: number[] };
};

// ─── SVG Constants ────────────────────────────────────────────────────────────

const W = 200;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 32, left: 32 };
const PLOT_W = W - PAD.left - PAD.right; // 152
const PLOT_H = H - PAD.top - PAD.bottom; // 152

const toRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Sub-renderers ────────────────────────────────────────────────────────────

const arcPath = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

const GeometricLayer = ({ manifest }: { manifest: DiagramManifest }) => {
  const pointMap: Record<string, DiagramPoint> = {};
  manifest.points?.forEach(p => { if (p.label) pointMap[p.label] = p; });

  return (
    <>
      {manifest.circles?.map((c, i) => (
        <g key={`circle-${i}`}>
          <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#374151" strokeWidth={1.5} />
          {c.label && (
            <text
              x={c.cx + (c.labelOffset?.dx ?? -6)}
              y={c.cy + (c.labelOffset?.dy ?? -4)}
              fontSize={9}
              fill="#374151"
              textAnchor="middle"
            >
              {c.label}
            </text>
          )}
        </g>
      ))}

      {manifest.lines?.map((l, i) => {
        const mid = { x: (l.x1 + l.x2) / 2, y: (l.y1 + l.y2) / 2 };
        return (
          <g key={`line-${i}`}>
            <line
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#374151" strokeWidth={1.5}
              strokeDasharray={l.dashed ? '4 3' : undefined}
            />
            {l.label && (
              <text x={mid.x + 4} y={mid.y - 3} fontSize={8} fill="#6b7280">{l.label}</text>
            )}
          </g>
        );
      })}

      {manifest.angleMarkers?.map((a, i) => (
        <g key={`angle-${i}`}>
          <path d={arcPath(a.cx, a.cy, a.r, a.startAngle, a.endAngle)} fill="none" stroke="#3b82f6" strokeWidth={1} />
          {a.label && (() => {
            const midDeg = (a.startAngle + a.endAngle) / 2;
            const lx = a.cx + (a.r + 8) * Math.cos(toRad(midDeg));
            const ly = a.cy + (a.r + 8) * Math.sin(toRad(midDeg));
            return <text x={lx} y={ly} fontSize={7.5} fill="#3b82f6" textAnchor="middle">{a.label}</text>;
          })()}
        </g>
      ))}

      {manifest.points?.map((p, i) => (
        <g key={`pt-${i}`}>
          <circle cx={p.x} cy={p.y} r={2.5} fill="#374151" />
          {p.label && (
            <text x={p.x + 5} y={p.y - 4} fontSize={9} fill="#111827" fontWeight="bold">{p.label}</text>
          )}
        </g>
      ))}
    </>
  );
};

const GraphLayer = ({ manifest }: { manifest: DiagramManifest }) => {
  const ax = manifest.axes;
  if (!ax) return null;

  const toSvgX = (v: number) =>
    PAD.left + ((v - ax.x.min) / (ax.x.max - ax.x.min)) * PLOT_W;
  const toSvgY = (v: number) =>
    PAD.top + PLOT_H - ((v - ax.y.min) / (ax.y.max - ax.y.min)) * PLOT_H;

  const pts = manifest.dataPoints ?? [];
  const polyline = pts.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ');

  return (
    <>
      {/* Y axis */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#374151" strokeWidth={1.5} />
      {/* X axis */}
      <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#374151" strokeWidth={1.5} />

      {/* X ticks */}
      {(ax.x.ticks ?? [ax.x.max]).map(t => {
        const x = toSvgX(t);
        return (
          <g key={`xt-${t}`}>
            <line x1={x} y1={PAD.top + PLOT_H} x2={x} y2={PAD.top + PLOT_H + 4} stroke="#374151" strokeWidth={1} />
            <text x={x} y={PAD.top + PLOT_H + 11} fontSize={7} fill="#6b7280" textAnchor="middle">{t}</text>
          </g>
        );
      })}

      {/* Y ticks */}
      {(ax.y.ticks ?? [ax.y.max]).map(t => {
        const y = toSvgY(t);
        return (
          <g key={`yt-${t}`}>
            <line x1={PAD.left - 4} y1={y} x2={PAD.left} y2={y} stroke="#374151" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 3} fontSize={7} fill="#6b7280" textAnchor="end">{t}</text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={PAD.left + PLOT_W / 2} y={H - 2} fontSize={8} fill="#374151" textAnchor="middle">{ax.x.label}</text>
      <text
        x={8} y={PAD.top + PLOT_H / 2}
        fontSize={8} fill="#374151" textAnchor="middle"
        transform={`rotate(-90, 8, ${PAD.top + PLOT_H / 2})`}
      >
        {ax.y.label}
      </text>

      {/* Data line */}
      {polyline && (
        <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
      )}

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={2.5} fill="#2563eb" />
      ))}
    </>
  );
};

const BarChartLayer = ({ bars }: { bars: Array<{ label: string; value: number }> }) => {
  if (bars.length === 0) return null;
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const barW = PLOT_W / bars.length;
  const gap = barW * 0.2;

  return (
    <>
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#374151" strokeWidth={1.5} />
      <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#374151" strokeWidth={1.5} />
      {bars.map((b, i) => {
        const bh = (b.value / maxVal) * PLOT_H;
        const x = PAD.left + i * barW + gap / 2;
        const y = PAD.top + PLOT_H - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - gap} height={bh} fill="#3b82f6" opacity={0.8} rx={2} />
            <text x={x + (barW - gap) / 2} y={PAD.top + PLOT_H + 11} fontSize={7} fill="#6b7280" textAnchor="middle">
              {b.label}
            </text>
            <text x={x + (barW - gap) / 2} y={y - 3} fontSize={7} fill="#374151" textAnchor="middle">
              {b.value}
            </text>
          </g>
        );
      })}
    </>
  );
};

const NumberLineLayer = ({ range }: { range: { min: number; max: number; marked?: number[] } }) => {
  const y = H / 2;
  const x0 = 20;
  const x1 = W - 20;
  const span = range.max - range.min || 1;
  const toX = (v: number) => x0 + ((v - range.min) / span) * (x1 - x0);

  const ticks: number[] = [];
  for (let v = range.min; v <= range.max; v++) ticks.push(v);

  return (
    <>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="#374151" strokeWidth={1.5} />
      {/* Arrow head */}
      <polygon points={`${x1},${y} ${x1 - 5},${y - 3} ${x1 - 5},${y + 3}`} fill="#374151" />
      {ticks.map(t => {
        const x = toX(t);
        const isMarked = range.marked?.includes(t);
        return (
          <g key={t}>
            <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={isMarked ? '#2563eb' : '#374151'} strokeWidth={isMarked ? 1.5 : 1} />
            <text x={x} y={y + 15} fontSize={8} fill={isMarked ? '#2563eb' : '#6b7280'} textAnchor="middle">{t}</text>
            {isMarked && <circle cx={x} cy={y} r={4} fill="#2563eb" />}
          </g>
        );
      })}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface DiagramRendererProps {
  manifest: DiagramManifest;
  className?: string;
  width?: number;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ manifest, className = '', width = 260 }) => {
  const viewBox = manifest.viewBox ?? `0 0 ${W} ${H}`;

  const renderContent = () => {
    switch (manifest.type) {
      case 'Velocity_Time_Graph':
      case 'Coordinate_Plane':
        return <GraphLayer manifest={manifest} />;

      case 'Bar_Chart':
        return manifest.bars ? <BarChartLayer bars={manifest.bars} /> : null;

      case 'Number_Line':
        return manifest.numberLineRange
          ? <NumberLineLayer range={manifest.numberLineRange} />
          : null;

      // All geometry types share the same SVG primitives
      case 'Circle_Geometry':
      case 'Triangle_Geometry':
      case 'Construction_Loci':
      case 'Generic':
      default:
        return <GeometricLayer manifest={manifest} />;
    }
  };

  return (
    <div className={`inline-block rounded-lg border border-gray-200 bg-white p-2 ${className}`}>
      <svg
        viewBox={viewBox}
        width={width}
        height={width}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Diagram: ${manifest.type}`}
      >
        {renderContent()}
      </svg>
    </div>
  );
};

export default DiagramRenderer;

// ─── QuestionText ─────────────────────────────────────────────────────────────
// Drop-in replacement for any <p>{question.text}</p> across teacher + student UI.
// Renders the text, then the diagram below it when diagram_manifest is present.

interface QuestionTextProps {
  text: string;
  manifest?: DiagramManifest | null;
  textClassName?: string;
  diagramWidth?: number;
}

export const QuestionText: React.FC<QuestionTextProps> = ({
  text,
  manifest,
  textClassName = 'font-medium text-gray-900 leading-relaxed',
  diagramWidth = 220,
}) => (
  <div>
    <MathText text={text} className={textClassName} block />
    {manifest && (
      <div className="mt-3">
        <DiagramRenderer manifest={manifest} width={diagramWidth} />
      </div>
    )}
  </div>
);
