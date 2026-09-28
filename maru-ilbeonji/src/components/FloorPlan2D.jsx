import { useMemo, useState } from 'react';
import { shade, isLight } from '../lib/color.js';

/**
 * 24평 / 33평 / 35평 평면도 (SVG, 외부 이미지 없음)
 * kind: floor(마루 시공) | wet(욕실) | entry(현관) | balcony(발코니)
 */
const PLANS = {
  24: {
    label: '24평형 · 2Bay · 방2 욕실1',
    w: 1000, h: 640,
    rooms: [
      { id: 'kitchen', name: '주방·식당', kind: 'floor', x: 0, y: 0, w: 400, h: 260 },
      { id: 'bath1', name: '욕실', kind: 'wet', x: 400, y: 0, w: 220, h: 150 },
      { id: 'entry', name: '현관', kind: 'entry', x: 400, y: 150, w: 220, h: 110 },
      { id: 'bed2', name: '침실2', kind: 'floor', x: 620, y: 0, w: 380, h: 260 },
      { id: 'living', name: '거실', kind: 'floor', x: 0, y: 260, w: 560, h: 280 },
      { id: 'master', name: '안방', kind: 'floor', x: 560, y: 260, w: 440, h: 280 },
      { id: 'balcony', name: '발코니', kind: 'balcony', x: 0, y: 540, w: 1000, h: 100 },
    ],
  },
  33: {
    label: '33평형 · 3Bay · 방3 욕실2',
    w: 1000, h: 660,
    rooms: [
      { id: 'kitchen', name: '주방·식당', kind: 'floor', x: 0, y: 0, w: 380, h: 300 },
      { id: 'bath1', name: '공용욕실', kind: 'wet', x: 380, y: 0, w: 160, h: 170 },
      { id: 'entry', name: '현관', kind: 'entry', x: 380, y: 170, w: 160, h: 130 },
      { id: 'bed3', name: '침실3', kind: 'floor', x: 540, y: 0, w: 320, h: 300 },
      { id: 'bath2', name: '안방욕실', kind: 'wet', x: 860, y: 0, w: 140, h: 140 },
      { id: 'dress', name: '드레스룸', kind: 'floor', x: 860, y: 140, w: 140, h: 160 },
      { id: 'bed2', name: '침실2', kind: 'floor', x: 0, y: 300, w: 280, h: 260 },
      { id: 'living', name: '거실', kind: 'floor', x: 280, y: 300, w: 420, h: 260 },
      { id: 'master', name: '안방', kind: 'floor', x: 700, y: 300, w: 300, h: 260 },
      { id: 'balcony', name: '발코니', kind: 'balcony', x: 0, y: 560, w: 1000, h: 100 },
    ],
  },
  35: {
    label: '35평형 · 4Bay · 방4 욕실2',
    w: 1100, h: 660,
    rooms: [
      { id: 'kitchen', name: '주방·식당', kind: 'floor', x: 0, y: 0, w: 440, h: 300 },
      { id: 'bath1', name: '공용욕실', kind: 'wet', x: 440, y: 0, w: 180, h: 160 },
      { id: 'entry', name: '현관', kind: 'entry', x: 440, y: 160, w: 180, h: 140 },
      { id: 'alpha', name: '알파룸', kind: 'floor', x: 620, y: 0, w: 220, h: 300 },
      { id: 'bath2', name: '안방욕실', kind: 'wet', x: 840, y: 0, w: 260, h: 140 },
      { id: 'dress', name: '드레스룸', kind: 'floor', x: 840, y: 140, w: 260, h: 160 },
      { id: 'bed3', name: '침실3', kind: 'floor', x: 0, y: 300, w: 220, h: 260 },
      { id: 'bed2', name: '침실2', kind: 'floor', x: 220, y: 300, w: 220, h: 260 },
      { id: 'living', name: '거실', kind: 'floor', x: 440, y: 300, w: 400, h: 260 },
      { id: 'master', name: '안방', kind: 'floor', x: 840, y: 300, w: 260, h: 260 },
      { id: 'balcony', name: '발코니', kind: 'balcony', x: 0, y: 560, w: 1100, h: 100 },
    ],
  },
};

export function pickPlanKey(pyeong) {
  const keys = Object.keys(PLANS).map(Number);
  return keys.reduce((best, k) => (Math.abs(k - pyeong) < Math.abs(best - pyeong) ? k : best), keys[0]);
}

/* ---------- 마루 패턴 정의 ---------- */
function WoodPattern({ id, color }) {
  const seam = shade(color, isLight(color) ? -0.22 : -0.4);
  const grain = shade(color, -0.1);
  const rows = [0, 1, 2, 3];
  return (
    <pattern id={id} width="240" height="120" patternUnits="userSpaceOnUse">
      <rect width="240" height="120" fill={color} />
      {rows.map((r) => {
        const off = [0, 120, 60, 180][r];
        return (
          <g key={r}>
            {[-240, 0, 240].map((dx) => (
              <g key={dx}>
                <rect x={off + dx} y={r * 30} width="240" height="30" fill={shade(color, (r % 2 ? 0.04 : -0.03))} stroke={seam} strokeWidth="1.5" />
                <path d={`M${off + dx + 20} ${r * 30 + 11} q60 -4 120 1 t100 0`} stroke={grain} strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d={`M${off + dx + 10} ${r * 30 + 21} q70 3 130 -1 t90 1`} stroke={grain} strokeWidth="0.6" fill="none" opacity="0.45" />
              </g>
            ))}
          </g>
        );
      })}
    </pattern>
  );
}

function HerringbonePattern({ id, color }) {
  // 브릭 40x20, 격자 (20,20)/(40,-40) → 80x80 타일에 H/V 브릭 4개씩
  const seam = shade(color, isLight(color) ? -0.16 : -0.35);
  const offsets = [-80, 0, 80];
  const bricks = [];
  [0, 1, 2, 3].forEach((m) => {
    offsets.forEach((ox) => offsets.forEach((oy) => {
      bricks.push({ key: `h${m}${ox}${oy}`, x: 20 * m + ox, y: 20 * m + oy, w: 40, h: 20, t: m % 2 ? 0.03 : -0.02 });
      bricks.push({ key: `v${m}${ox}${oy}`, x: 20 * m + ox, y: 20 * m + 20 + oy, w: 20, h: 40, t: m % 2 ? -0.03 : 0.02 });
    }));
  });
  return (
    <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45) scale(0.9)">
      <rect width="80" height="80" fill={color} />
      {bricks.map((b) => (
        <rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={shade(color, b.t)} stroke={seam} strokeWidth="1" />
      ))}
    </pattern>
  );
}

function StonePattern({ id, color }) {
  const grout = shade(color, 0.35);
  const vein = shade(color, 0.22);
  return (
    <pattern id={id} width="120" height="120" patternUnits="userSpaceOnUse">
      <rect width="120" height="120" fill={grout} />
      <rect x="1.5" y="1.5" width="57" height="57" fill={shade(color, 0.03)} />
      <rect x="61.5" y="1.5" width="57" height="57" fill={shade(color, -0.04)} />
      <rect x="1.5" y="61.5" width="57" height="57" fill={shade(color, -0.02)} />
      <rect x="61.5" y="61.5" width="57" height="57" fill={shade(color, 0.05)} />
      <path d="M5 40 Q25 30 35 12 T55 4" stroke={vein} strokeWidth="0.8" fill="none" opacity="0.7" />
      <path d="M66 110 Q80 90 100 88 T116 70" stroke={vein} strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="90" cy="25" r="1.4" fill={shade(color, -0.2)} opacity="0.5" />
      <circle cx="20" cy="95" r="1.2" fill={shade(color, -0.2)} opacity="0.5" />
    </pattern>
  );
}

export function FloorPattern({ id, material }) {
  if (material.type === 'herringbone') return <HerringbonePattern id={id} color={material.color} />;
  if (material.type === 'stone') return <StonePattern id={id} color={material.color} />;
  return <WoodPattern id={id} color={material.color} />;
}

export default function FloorPlan2D({ pyeong = 24, material, apartmentName }) {
  const planKey = pickPlanKey(pyeong);
  const plan = PLANS[planKey];
  const [hover, setHover] = useState(null);
  const patternId = `floor-${material.id}`;
  const labelTone = isLight(material.color) ? 'dark' : 'light';

  const floorRooms = useMemo(() => plan.rooms.filter((r) => r.kind === 'floor'), [plan]);
  const pad = 40;
  const vb = `${-pad} ${-pad} ${plan.w + pad * 2} ${plan.h + pad * 2 + 30}`;
  // 도면 좌표 → 평 환산 (전체 floor 면적 합이 대략 전용면적에 맞도록 비례)
  const totalFloorPx = floorRooms.reduce((s, r) => s + r.w * r.h, 0);
  const roomPyeong = (r) => ((r.w * r.h) / totalFloorPx) * pyeong * 0.78;

  return (
    <div className="plan">
      <div className="plan__meta">
        <span className="plan__badge">{plan.label}</span>
        {apartmentName && <span className="plan__apt">{apartmentName}</span>}
      </div>

      <svg className="plan__svg" viewBox={vb} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${plan.label} 평면도`}>
        <defs>
          <FloorPattern id={patternId} material={material} />
          <pattern id="wet-tile" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="#e4e8ea" />
            <path d="M30 0H0V30" stroke="#c9d0d4" strokeWidth="1.2" fill="none" />
          </pattern>
          <pattern id="balcony-tile" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="#d9d4cb" />
            <path d="M50 0H0V50" stroke="#c4bdb1" strokeWidth="1.2" fill="none" />
          </pattern>
          <pattern id="entry-tile" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#bdb7ad" />
            <path d="M40 0H0V40" stroke="#a79f93" strokeWidth="1.2" fill="none" />
          </pattern>
        </defs>

        {/* 비시공 구역 */}
        {plan.rooms.filter((r) => r.kind !== 'floor').map((r) => (
          <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h}
            fill={`url(#${r.kind === 'wet' ? 'wet-tile' : r.kind === 'balcony' ? 'balcony-tile' : 'entry-tile'})`} />
        ))}

        {/* 마루 시공 구역: 재질 변경 시 key 로 재마운트 → CSS 페이드 전환 */}
        <g key={material.id} className="plan__floors">
          {floorRooms.map((r) => (
            <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${patternId})`} />
          ))}
        </g>

        {/* 호버 하이라이트 */}
        {floorRooms.map((r) => (
          <rect key={`hit-${r.id}`} x={r.x} y={r.y} width={r.w} height={r.h}
            className={`plan__hit ${hover === r.id ? 'is-hover' : ''}`}
            onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} />
        ))}

        {/* 벽체 */}
        {plan.rooms.map((r) => (
          <rect key={`wall-${r.id}`} x={r.x} y={r.y} width={r.w} height={r.h} className="plan__wall" />
        ))}
        <rect x="0" y="0" width={plan.w} height={plan.h} className="plan__outer" />

        {/* 발코니 창호 */}
        <line x1="0" y1={plan.h} x2={plan.w} y2={plan.h} className="plan__window" />
        <line x1="0" y1={plan.h - 6} x2={plan.w} y2={plan.h - 6} className="plan__window plan__window--inner" />

        {/* 라벨 */}
        {plan.rooms.map((r) => {
          const onFloor = r.kind === 'floor';
          return (
            <g key={`lb-${r.id}`} className={`plan__label ${onFloor ? `plan__label--${labelTone}` : 'plan__label--muted'}`}>
              <text x={r.x + r.w / 2} y={r.y + r.h / 2 - (onFloor ? 6 : 0)} textAnchor="middle" dominantBaseline="middle" className="plan__room-name">
                {r.name}
              </text>
              {onFloor && (
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 20} textAnchor="middle" dominantBaseline="middle" className="plan__room-size">
                  약 {roomPyeong(r).toFixed(1)}평
                </text>
              )}
            </g>
          );
        })}

        {/* 치수선 */}
        <g className="plan__dim">
          <line x1="0" y1={-20} x2={plan.w} y2={-20} />
          <line x1="0" y1={-28} x2="0" y2={-12} />
          <line x1={plan.w} y1={-28} x2={plan.w} y2={-12} />
          <text x={plan.w / 2} y={-26} textAnchor="middle">{(plan.w / 100).toFixed(1)}m 기준 도식</text>
        </g>

        {/* 범례 */}
        <g className="plan__legend" transform={`translate(0 ${plan.h + 22})`}>
          <rect width="18" height="18" fill={`url(#${patternId})`} className="plan__legend-swatch" />
          <text x="26" y="14">마루 시공 영역 · {material.name}</text>
          <rect x="330" width="18" height="18" fill="url(#wet-tile)" className="plan__legend-swatch" />
          <text x="356" y="14">욕실/현관/발코니 (시공 제외)</text>
        </g>
      </svg>
    </div>
  );
}
