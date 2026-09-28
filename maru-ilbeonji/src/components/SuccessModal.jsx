import { useEffect } from 'react';
import { formatWon } from '../lib/api.js';

export default function SuccessModal({ result, onClose, onViewHistory }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!result) return null;
  const { data, offline } = result;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={onClose}>
      <div className="modal__card" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`modal__icon ${offline ? 'is-warn' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24">{offline ? <path d="M12 8v5M12 16.5v.5" /> : <path d="m5 12 5 5 9-10" />}</svg>
        </div>
        <h3 id="modal-title" className="modal__title">
          {offline ? '신청 내용이 임시 저장되었습니다' : '상담 신청이 접수되었습니다'}
        </h3>
        <p className="modal__desc">
          {offline
            ? '서버 연결이 원활하지 않아 이 기기에 먼저 저장했습니다. 잠시 후 다시 신청해 주시거나 고객센터로 문의해 주세요.'
            : `${data.customerName}님, 담당 매니저가 ${data.phone} 으로 연락드리겠습니다.`}
        </p>
        <dl className="modal__summary">
          <div><dt>단지</dt><dd>{data.apartmentName} · {data.pyeong}평</dd></div>
          <div><dt>자재</dt><dd>{data.materialName}</dd></div>
          <div><dt>예상 견적</dt><dd className="modal__price">{formatWon(data.totalPrice)}</dd></div>
        </dl>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>계속 둘러보기</button>
          <button type="button" className="btn btn--primary" onClick={onViewHistory}>신청 내역 보기</button>
        </div>
      </div>
    </div>
  );
}
