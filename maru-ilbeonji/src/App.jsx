import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import FloorPlan2D from './components/FloorPlan2D.jsx';
import MaterialPalette from './components/MaterialPalette.jsx';
import QuotePanel from './components/QuotePanel.jsx';
import ConsultForm from './components/ConsultForm.jsx';
import SuccessModal from './components/SuccessModal.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { fetchApartments, fetchMaterials, calcTotal } from './lib/api.js';
import './App.css';

const Room3D = lazy(() => import('./components/Room3D.jsx'));

const pageFromHash = () => (window.location.hash === '#/history' ? 'history' : 'simulator');

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [materials, setMaterials] = useState([]);
  const [apartment, setApartment] = useState(null);
  const [materialId, setMaterialId] = useState(null);
  const [viewMode, setViewMode] = useState('2d');
  const [usingMock, setUsingMock] = useState(false);
  const [result, setResult] = useState(null);
  const [lastApplicant, setLastApplicant] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      const [mats, apts] = await Promise.all([fetchMaterials(), fetchApartments('')]);
      setMaterials(mats.data);
      setMaterialId((id) => id ?? mats.data[0]?.id);
      setApartment((a) => a ?? apts.data[0] ?? null);
      setUsingMock(mats.fromMock || apts.fromMock);
    })();
  }, []);

  // 해시 라우팅 (#/history)
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((p) => {
    window.location.hash = p === 'history' ? '#/history' : '#/';
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const material = useMemo(() => materials.find((m) => m.id === materialId), [materials, materialId]);
  const totalPrice = calcTotal(apartment?.pyeong, material?.pricePerPyeong);

  const onSubmitted = (res) => {
    setResult(res);
    setLastApplicant({ name: res.data.customerName, phone: res.data.phone });
  };

  return (
    <div className="app">
      <Header page={page} onNavigate={navigate} selectedApartment={apartment} onSelectApartment={setApartment} />

      {usingMock && (
        <div className="banner" role="status">서버에 연결할 수 없어 샘플 데이터로 표시 중입니다.</div>
      )}

      {page === 'history' ? (
        <HistoryPage lastApplicant={lastApplicant} onGoSimulator={() => navigate('simulator')} />
      ) : (
        <main className="layout">
          <section className="viewer">
            <div className="viewer__head">
              <div>
                <p className="eyebrow">VIRTUAL FLOORING</p>
                <h1 className="viewer__title">
                  {apartment ? `${apartment.name} ${apartment.pyeong}평` : '아파트를 선택해 주세요'}
                </h1>
              </div>
              <div className="tabs" role="tablist" aria-label="뷰어 모드">
                <button type="button" role="tab" aria-selected={viewMode === '2d'}
                  className={`tabs__btn ${viewMode === '2d' ? 'is-active' : ''}`} onClick={() => setViewMode('2d')}>
                  2D 평면도 모드
                </button>
                <button type="button" role="tab" aria-selected={viewMode === '3d'}
                  className={`tabs__btn ${viewMode === '3d' ? 'is-active' : ''}`} onClick={() => setViewMode('3d')}>
                  3D 가상 시공 모드
                </button>
                <span className={`tabs__indicator ${viewMode === '3d' ? 'is-right' : ''}`} aria-hidden="true" />
              </div>
            </div>

            <div className="viewer__stage">
              {!material ? (
                <div className="viewer__loading">자재 정보를 불러오는 중…</div>
              ) : viewMode === '2d' ? (
                <FloorPlan2D pyeong={apartment?.pyeong ?? 24} material={material} apartmentName={apartment?.name} />
              ) : (
                <Suspense fallback={<div className="viewer__loading">3D 룸을 준비하는 중…</div>}>
                  <Room3D material={material} livingArea={apartment?.livingArea ?? 12} />
                </Suspense>
              )}
              {material && (
                <div className="viewer__chip" key={material.id}>
                  <span className="viewer__chip-label">적용 자재</span>
                  <strong>{material.name}</strong>
                  {material.feature && <span className="viewer__chip-feature">{material.feature}</span>}
                </div>
              )}
            </div>
          </section>

          <aside className="panel">
            <MaterialPalette materials={materials} selectedId={materialId} onSelect={setMaterialId} />
            <QuotePanel apartment={apartment} material={material} totalPrice={totalPrice} />
            <ConsultForm apartment={apartment} material={material} totalPrice={totalPrice} onSubmitted={onSubmitted} />
          </aside>
        </main>
      )}

      <footer className="footer">
        <span>© 마루일번지 · 바닥재/마루 시공 전문</span>
        <span>본 화면의 견적은 참고용이며 실측 후 확정됩니다.</span>
      </footer>

      {result && (
        <SuccessModal
          result={result}
          onClose={() => setResult(null)}
          onViewHistory={() => { setResult(null); navigate('history'); }}
        />
      )}
    </div>
  );
}
