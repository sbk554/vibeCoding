import { useEffect, useState } from 'react';
import {
  fetchMyConsultations, getLocalConsultations, formatPhone, isValidPhone, formatWon, formatDate,
} from '../lib/api.js';
import { STATUS_LABEL } from '../data/mock.js';

const STEPS = ['new', 'contacted', 'done'];

function StatusSteps({ status }) {
  const idx = STEPS.indexOf(status);
  return (
    <ol className="steps">
      {STEPS.map((s, i) => (
        <li key={s} className={`steps__item ${i <= idx ? 'is-done' : ''} ${i === idx ? 'is-current' : ''}`}>
          <span className="steps__dot" />
          <span className="steps__label">{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

function ConsultCard({ item }) {
  return (
    <article className="history-card">
      <header className="history-card__head">
        <div>
          <h3 className="history-card__title">{item.apartmentName ?? item.apartmentId} · {item.pyeong}평</h3>
          <time className="history-card__date">{formatDate(item.createdAt)} 신청</time>
        </div>
        <div className="history-card__badges">
          {item.source === 'pending' && <span className="badge badge--warn">서버 미전송</span>}
          <span className={`badge badge--${item.status}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
        </div>
      </header>
      <dl className="history-card__grid">
        <div><dt>선택 자재</dt><dd>{item.materialName ?? item.materialId}</dd></div>
        <div><dt>예상 견적</dt><dd className="history-card__price">{formatWon(item.totalPrice)}</dd></div>
        <div><dt>신청자</dt><dd className="nowrap">{item.customerName} · {formatPhone(item.phone)}</dd></div>
        {item.notes && <div className="history-card__notes"><dt>메모</dt><dd>{item.notes}</dd></div>}
      </dl>
      <StatusSteps status={item.status} />
    </article>
  );
}

export default function HistoryPage({ lastApplicant, onGoSimulator }) {
  const [name, setName] = useState(lastApplicant?.name ?? '');
  const [phone, setPhone] = useState(lastApplicant?.phone ?? '');
  const [items, setItems] = useState(() => getLocalConsultations());
  const [mode, setMode] = useState('device'); // device | server | local
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (n = name, p = phone) => {
    if (!n.trim() || !isValidPhone(p)) {
      setError('이름과 연락처(010-1234-5678)를 정확히 입력해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetchMyConsultations(n, p);
    setItems(res.data);
    setMode(res.mode);
    setLoading(false);
  };

  // 방금 신청하고 넘어온 경우 자동 조회
  useEffect(() => {
    if (lastApplicant?.name && lastApplicant?.phone) lookup(lastApplicant.name, lastApplicant.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => { e.preventDefault(); lookup(); };

  return (
    <main className="history">
      <section className="history__hero">
        <p className="eyebrow">MY CONSULTATION</p>
        <h1 className="history__title">견적 상담 신청 내역</h1>
        <p className="history__desc">신청 시 입력한 이름과 연락처로 접수 현황을 확인할 수 있습니다.</p>
        <form className="lookup" onSubmit={onSubmit}>
          <input className="field__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" aria-label="이름" />
          <input className="field__input" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-1234-5678" inputMode="numeric" aria-label="연락처" />
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? '조회 중…' : '내역 조회'}</button>
        </form>
        {error && <p className="field__error">{error}</p>}
      </section>

      <section className="history__list">
        <div className="history__list-head">
          <h2>
            {mode === 'device' && '이 기기에서 신청한 내역'}
            {mode === 'server' && '조회 결과'}
            {mode === 'local' && '이 기기에 저장된 내역'}
            <span className="history__count">{items.length}건</span>
          </h2>
          {mode === 'local' && (
            <p className="history__notice">서버 조회에 실패해 이 기기에 저장된 기록만 표시합니다. (supabase/02_my_consultations_rpc.sql 실행 여부를 확인하세요)</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty">
            <p>표시할 신청 내역이 없습니다.</p>
            <button type="button" className="btn btn--ghost" onClick={onGoSimulator}>가상 시공 후 상담 신청하기</button>
          </div>
        ) : (
          <div className="history__grid">
            {items.map((it) => <ConsultCard key={it.id} item={it} />)}
          </div>
        )}
      </section>
    </main>
  );
}
