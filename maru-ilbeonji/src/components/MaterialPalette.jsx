import { FloorPattern } from './FloorPlan2D.jsx';
import { formatWon } from '../lib/api.js';

const TYPE_LABEL = { wood: '우드', herringbone: '헤링본', stone: '스톤' };

export default function MaterialPalette({ materials, selectedId, onSelect }) {
  return (
    <section className="panel-card">
      <header className="panel-card__head">
        <h2 className="panel-card__title">마루 자재 선택</h2>
        <span className="panel-card__caption">클릭 시 도면·3D에 즉시 반영</span>
      </header>
      <div className="palette" role="radiogroup" aria-label="마루 자재">
        {materials.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selectedId === m.id}
            className={`swatch ${selectedId === m.id ? 'is-selected' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            <svg className="swatch__chip" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs><FloorPattern id={`sw-${m.id}`} material={m} /></defs>
              <rect width="240" height="240" fill={`url(#sw-${m.id})`} />
            </svg>
            <span className="swatch__body">
              <span className="swatch__type">{TYPE_LABEL[m.type] ?? m.type}</span>
              <span className="swatch__name">{m.name}</span>
              <span className="swatch__price">평당 {formatWon(m.pricePerPyeong)}</span>
            </span>
            <span className="swatch__check" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
