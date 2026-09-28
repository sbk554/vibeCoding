/**
 * 마루일번지 API 레이어 (Fetch API 기반)
 *
 * 논리 엔드포인트 → Supabase REST(PostgREST) 매핑
 *   GET  /api/apartments?query=   → GET  /rest/v1/apartments?name=ilike.*query*
 *   GET  /api/flooring-materials  → GET  /rest/v1/flooring_materials
 *   POST /api/consultations       → POST /rest/v1/consultations   (Prefer: return=minimal)
 *   (신청 내역 조회)               → POST /rest/v1/rpc/get_my_consultations  (02_my_consultations_rpc.sql)
 *
 * - consultations 에는 SELECT 정책이 없으므로 insert 시 return=minimal 로 요청합니다.
 * - pyeong / total_price 는 DB 트리거가 다시 계산하므로 화면 값은 참고용입니다.
 * - 네트워크/서버 오류 시 Mock 데이터 · localStorage 로 폴백하여 UI가 항상 동작합니다.
 */
import { MOCK_APARTMENTS, MOCK_MATERIALS } from '../data/mock.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REST = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : null;
const TIMEOUT_MS = 6000;
const LOCAL_KEY = 'maru1_my_consultations';

async function request(path, options = {}) {
  if (!REST || !SUPABASE_KEY) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${REST}${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- 매퍼 (snake_case → camelCase) ---------- */
const toApartment = (r) => ({ id: r.id, name: r.name, pyeong: r.pyeong, livingArea: r.living_area });
const toMaterial = (r) => ({
  id: r.id, name: r.name, pricePerPyeong: r.price_per_pyeong, color: r.color,
  type: r.type, textureUrl: r.texture_url, feature: r.feature,
});
const toConsultation = (r) => ({
  id: r.id, apartmentId: r.apartment_id, apartmentName: r.apartment_name,
  materialId: r.material_id, materialName: r.material_name,
  pyeong: r.pyeong, totalPrice: Number(r.total_price),
  customerName: r.customer_name, phone: r.phone, notes: r.notes,
  status: r.status, createdAt: r.created_at, source: 'server',
});

/* ---------- 연락처 포맷 (DB 체크: ^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$) ---------- */
export const digitsOnly = (v = '') => v.replace(/[^0-9]/g, '');
export function formatPhone(v = '') {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
export const isValidPhone = (v) => /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formatPhone(v));

/* ---------- 이 브라우저에서 신청한 내역 (localStorage) ---------- */
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
}
function writeLocal(list) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 50))); } catch { /* 저장 불가 환경 무시 */ }
}
export const getLocalConsultations = () => readLocal();

/* ---------- GET /api/apartments?query= ---------- */
export async function fetchApartments(query = '') {
  const q = query.trim();
  try {
    const filter = q ? `&name=ilike.*${encodeURIComponent(q)}*` : '';
    const rows = await request(`/apartments?select=*&order=pyeong.asc${filter}`);
    return { data: rows.map(toApartment), fromMock: false };
  } catch (err) {
    console.warn('[apartments] mock 폴백:', err.message);
    const data = MOCK_APARTMENTS.filter((a) => !q || a.name.includes(q) || String(a.pyeong).includes(q.replace('평', '')));
    return { data, fromMock: true };
  }
}

/* ---------- GET /api/flooring-materials ---------- */
export async function fetchMaterials() {
  try {
    const rows = await request('/flooring_materials?select=*&order=id.asc');
    if (!rows.length) throw new Error('자재 데이터 없음');
    return { data: rows.map(toMaterial), fromMock: false };
  } catch (err) {
    console.warn('[materials] mock 폴백:', err.message);
    return { data: MOCK_MATERIALS, fromMock: true };
  }
}

/* ---------- POST /api/consultations ----------
 * payload: { apartmentId, materialId, pyeong, totalPrice, customerName, phone, notes }
 * + 화면 표시용 apartmentName, materialName (DB 로는 전송하지 않음)
 */
export async function createConsultation(payload) {
  const body = {
    apartment_id: payload.apartmentId,
    material_id: payload.materialId,
    pyeong: payload.pyeong,
    total_price: payload.totalPrice,
    customer_name: payload.customerName.trim(),
    phone: formatPhone(payload.phone),
    notes: payload.notes?.trim() || null,
  };

  let offline = false;
  try {
    await request('/consultations', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' }, // SELECT 정책이 없으므로 representation 불가
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[consultations] 서버 전송 실패 → 이 기기에 임시 저장:', err.message);
    offline = true;
  }

  const record = {
    id: `local-${Date.now()}`,
    apartmentId: body.apartment_id, apartmentName: payload.apartmentName,
    materialId: body.material_id, materialName: payload.materialName,
    pyeong: body.pyeong, totalPrice: body.total_price,
    customerName: body.customer_name, phone: body.phone, notes: body.notes,
    status: 'new', createdAt: new Date().toISOString(),
    source: offline ? 'pending' : 'device', // pending: 서버 미전송
  };
  writeLocal([record, ...readLocal()]);
  return { data: record, offline };
}

/* ---------- 내 신청 내역 조회 (이름 + 연락처) ---------- */
export async function fetchMyConsultations(name, phone) {
  const n = name.trim();
  const p = digitsOnly(phone);
  const locals = readLocal().filter((c) => c.customerName === n && digitsOnly(c.phone) === p);

  try {
    const rows = await request('/rpc/get_my_consultations', {
      method: 'POST',
      body: JSON.stringify({ p_name: n, p_phone: formatPhone(phone) }),
    });
    const server = rows.map(toConsultation);
    // 서버 기록이 있으면 서버 기준, 서버로 못 보낸(pending) 건만 로컬에서 추가
    const pending = locals.filter((c) => c.source === 'pending');
    return { data: [...pending, ...server].sort(byDateDesc), mode: 'server' };
  } catch (err) {
    console.warn('[history] RPC 조회 실패 → 이 기기 기록 표시:', err.message);
    return { data: locals.sort(byDateDesc), mode: 'local' };
  }
}

const byDateDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

export const calcTotal = (pyeong, pricePerPyeong) => (pyeong || 0) * (pricePerPyeong || 0);
export const formatWon = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
export const formatDate = (iso) =>
  new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
