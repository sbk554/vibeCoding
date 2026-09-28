import { useEffect, useRef, useState } from 'react';
import { fetchApartments } from '../lib/api.js';

function highlight(text, q) {
  if (!q) return text;
  const i = text.indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function Header({ page, onNavigate, selectedApartment, onSelectApartment }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // 디바운스 검색 (GET /api/apartments?query=)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await fetchApartments(query);
      if (alive) {
        setResults(data);
        setActive(-1);
        setLoading(false);
      }
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (apt) => {
    onSelectApartment(apt);
    setQuery('');
    setOpen(false);
    if (page !== 'simulator') onNavigate('simulator');
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <header className="header">
      <div className="header__inner">
        <button type="button" className="logo" onClick={() => onNavigate('simulator')} aria-label="마루일번지 홈">
          <span className="logo__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M4 26h24M6 22h20M8 18h16M10 14h12M12 10h8M14 6h4" /></svg>
          </span>
          <span className="logo__text">마루일번지</span>
          <span className="logo__sub">Flooring Simulator</span>
        </button>

        <div className="search" ref={boxRef}>
          <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            className="search__input"
            type="search"
            value={query}
            placeholder={selectedApartment ? `${selectedApartment.name} ${selectedApartment.pyeong}평 · 다른 단지 검색` : '아파트명 또는 평형 검색 (예: 반포, 33)'}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open}
            aria-controls="apt-listbox"
            aria-autocomplete="list"
          />
          {open && (
            <ul className="search__list" id="apt-listbox" role="listbox">
              {loading && <li className="search__empty">검색 중…</li>}
              {!loading && results.length === 0 && <li className="search__empty">검색 결과가 없습니다.</li>}
              {!loading && results.map((apt, i) => (
                <li
                  key={apt.id}
                  role="option"
                  aria-selected={i === active}
                  className={`search__item ${i === active ? 'is-active' : ''} ${selectedApartment?.id === apt.id ? 'is-selected' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); choose(apt); }}
                >
                  <span className="search__name">{highlight(apt.name, query.trim())}</span>
                  <span className="search__tags">
                    <span className="tag">{apt.pyeong}평형</span>
                    <span className="tag tag--ghost">거실 {apt.livingArea}평</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="nav">
          <button type="button" className={`nav__link ${page === 'simulator' ? 'is-active' : ''}`} onClick={() => onNavigate('simulator')}>가상 시공</button>
          <button type="button" className={`nav__link ${page === 'history' ? 'is-active' : ''}`} onClick={() => onNavigate('history')}>신청 내역</button>
        </nav>
      </div>
    </header>
  );
}
