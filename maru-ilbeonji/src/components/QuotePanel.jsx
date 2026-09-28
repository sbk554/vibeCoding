import { useEffect, useRef, useState } from 'react';
import { formatWon } from '../lib/api.js';

// 견적가가 바뀔 때 숫자가 부드럽게 올라가거나 내려가도록 애니메이션
function useAnimatedNumber(value, duration = 450) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const v = from + (value - from) * eased;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = value; };
  }, [value, duration]);
  return display;
}

export default function QuotePanel({ apartment, material, totalPrice }) {
  const animated = useAnimatedNumber(totalPrice);
  return (
    <section className="panel-card quote">
      <header className="panel-card__head">
        <h2 className="panel-card__title">시공 정보 · 예상 견적</h2>
      </header>
      <dl className="quote__list">
        <div className="quote__row">
          <dt>단지</dt>
          <dd>{apartment ? apartment.name : '—'}</dd>
        </div>
        <div className="quote__row">
          <dt>시공 평수</dt>
          <dd>{apartment ? `${apartment.pyeong}평` : '—'}</dd>
        </div>
        <div className="quote__row">
          <dt>선택 자재</dt>
          <dd>{material ? material.name : '—'}</dd>
        </div>
        <div className="quote__row">
          <dt>평당 단가</dt>
          <dd>{material ? formatWon(material.pricePerPyeong) : '—'}</dd>
        </div>
      </dl>
      <div className="quote__total">
        <span className="quote__total-label">예상 총 시공 견적가</span>
        <strong className="quote__total-value">{formatWon(animated)}</strong>
        <span className="quote__formula">
          {apartment && material ? `${apartment.pyeong}평 × ${formatWon(material.pricePerPyeong)}` : ''}
        </span>
      </div>
      <p className="quote__note">※ 자재·기본 시공비 기준 예상가이며, 철거·바닥 평탄화·확장부 여부에 따라 실측 후 확정됩니다.</p>
    </section>
  );
}
