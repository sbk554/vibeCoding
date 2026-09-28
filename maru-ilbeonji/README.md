# 마루일번지 · 가상 시공 & 견적 (React + Vite + R3F + Supabase)

## 실행
```bash
npm install
npm run dev        # http://localhost:5173
```
`.env` 에 Supabase URL / anon key 가 들어 있습니다. (anon key 는 공개용 키이며, 보안은 RLS 로 처리됩니다)

## Supabase 설정 (SQL Editor 에서 순서대로 실행)
1. `supabase/schema.sql` — 테이블 3개 · 견적 금액 서버 계산 트리거 · RLS · 시드 데이터
2. `supabase/02_my_consultations_rpc.sql` — (신청 내역 페이지용) 이름+연락처가 일치하는 본인 건만 반환하는 RPC

> consultations 에는 SELECT 정책이 없으므로(관리자만 열람) insert 는 `Prefer: return=minimal` 로 전송하고,
> 내역 조회는 2번 RPC 로만 가능합니다. RPC 를 실행하지 않아도 "이 기기에서 신청한 내역"은 표시됩니다.

## API 매핑 (src/lib/api.js, Fetch API)
| 논리 엔드포인트 | Supabase REST |
|---|---|
| GET /api/apartments?query= | GET /rest/v1/apartments?name=ilike.*q* |
| GET /api/flooring-materials | GET /rest/v1/flooring_materials |
| POST /api/consultations | POST /rest/v1/consultations |
| 내 신청 내역 | POST /rest/v1/rpc/get_my_consultations |

통신 실패 시 `src/data/mock.js` 의 Mock 데이터로 자동 폴백하고, 상담 신청은 이 기기에 임시 저장됩니다.

## 구조
```
src/
  App.jsx / App.css          레이아웃 · 해시 라우팅(#/history) · 전체 스타일 (인라인 스타일 없음)
  components/
    Header.jsx               로고 + 아파트 자동완성 검색(키보드 ↑↓ Enter 지원)
    FloorPlan2D.jsx          24/33/35평 반응형 SVG 평면도 + 오크/월넛/헤링본/타일 SVG 패턴
    Room3D.jsx               R3F 아이소메트릭 룸 (벽2 + 바닥 + 가구, OrbitControls, 재질 크로스페이드)
    MaterialPalette.jsx      자재 팔레트
    QuotePanel.jsx           평수 × 단가 실시간 견적 (숫자 애니메이션)
    ConsultForm.jsx          상담 신청 폼 (유효성 검사: DB 체크 제약과 동일)
    SuccessModal.jsx         신청 완료 모달
  pages/HistoryPage.jsx      신청 내역 조회 페이지
  lib/api.js                 Fetch API + Mock 폴백
  lib/floorTexture.js        Canvas 절차적 마루 텍스처 (외부 이미지 없음)
```
