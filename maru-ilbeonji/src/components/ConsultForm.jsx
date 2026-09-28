import { useState } from 'react';
import { createConsultation, formatPhone, isValidPhone } from '../lib/api.js';

const EMPTY = { customerName: '', phone: '', notes: '', agree: false };

export default function ConsultForm({ apartment, material, totalPrice, onSubmitted }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    const value = key === 'agree' ? e.target.checked
      : key === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!apartment) er.apartment = '상단 검색창에서 아파트를 먼저 선택해 주세요.';
    if (!material) er.material = '마루 자재를 선택해 주세요.';
    if (!form.customerName.trim()) er.customerName = '이름을 입력해 주세요.';
    else if (form.customerName.trim().length > 50) er.customerName = '이름은 50자 이내로 입력해 주세요.';
    if (!isValidPhone(form.phone)) er.phone = '010-1234-5678 형식으로 입력해 주세요.';
    if (form.notes.length > 1000) er.notes = '메모는 1000자 이내로 입력해 주세요.';
    if (!form.agree) er.agree = '개인정보 수집·이용에 동의해 주세요.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    const result = await createConsultation({
      apartmentId: apartment.id,
      materialId: material.id,
      pyeong: apartment.pyeong,
      totalPrice,
      customerName: form.customerName,
      phone: form.phone,
      notes: form.notes,
      apartmentName: apartment.name,
      materialName: material.name,
    });
    setSubmitting(false);
    setForm(EMPTY);
    onSubmitted(result);
  };

  return (
    <section className="panel-card">
      <header className="panel-card__head">
        <h2 className="panel-card__title">간편 견적 상담 신청</h2>
        <span className="panel-card__caption">영업일 기준 24시간 내 연락드립니다</span>
      </header>
      <form className="form" onSubmit={onSubmit} noValidate>
        {(errors.apartment || errors.material) && (
          <p className="form__alert">{errors.apartment || errors.material}</p>
        )}
        <label className="field">
          <span className="field__label">이름 <em>*</em></span>
          <input className={`field__input ${errors.customerName ? 'is-error' : ''}`} value={form.customerName}
            onChange={set('customerName')} placeholder="홍길동" maxLength={50} autoComplete="name" />
          {errors.customerName && <span className="field__error">{errors.customerName}</span>}
        </label>
        <label className="field">
          <span className="field__label">연락처 <em>*</em></span>
          <input className={`field__input ${errors.phone ? 'is-error' : ''}`} value={form.phone}
            onChange={set('phone')} placeholder="010-1234-5678" inputMode="numeric" autoComplete="tel" />
          {errors.phone && <span className="field__error">{errors.phone}</span>}
        </label>
        <label className="field">
          <span className="field__label">메모</span>
          <textarea className={`field__input field__textarea ${errors.notes ? 'is-error' : ''}`} value={form.notes}
            onChange={set('notes')} rows={3} maxLength={1000}
            placeholder="희망 시공 시기, 기존 바닥재, 확장 여부 등을 남겨주세요." />
          <span className="field__count">{form.notes.length}/1000</span>
          {errors.notes && <span className="field__error">{errors.notes}</span>}
        </label>
        <label className="check">
          <input type="checkbox" checked={form.agree} onChange={set('agree')} />
          <span>상담을 위한 개인정보(이름·연락처) 수집·이용에 동의합니다.</span>
        </label>
        {errors.agree && <span className="field__error">{errors.agree}</span>}
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? '신청 중…' : '간편 견적 상담 신청'}
        </button>
      </form>
    </section>
  );
}
