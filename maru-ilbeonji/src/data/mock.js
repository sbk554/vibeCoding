// API 통신 실패 시 사용하는 기본 Mock 데이터 (supabase/schema.sql 시드와 동일)
export const MOCK_APARTMENTS = [
  { id: 'apt-1', name: '마포래미안푸르지오', pyeong: 24, livingArea: 12 },
  { id: 'apt-2', name: '반포자이', pyeong: 35, livingArea: 18 },
  { id: 'apt-3', name: '헬리오시티', pyeong: 33, livingArea: 16 },
];

export const MOCK_MATERIALS = [
  { id: 'mat-1', name: '내추럴 오크 강마루', pricePerPyeong: 110000, color: '#d2a679', type: 'wood', feature: '밝고 따뜻한 톤, 가성비 좋은 강마루' },
  { id: 'mat-2', name: '딥 월넛 원목마루', pricePerPyeong: 220000, color: '#5c4033', type: 'wood', feature: '깊은 색감의 프리미엄 원목' },
  { id: 'mat-3', name: '화이트 헤링본 마루', pricePerPyeong: 160000, color: '#f0ebe1', type: 'herringbone', feature: '클래식한 헤링본 패턴, 화사한 공간' },
  { id: 'mat-4', name: '모던 스톤 타일마루', pricePerPyeong: 140000, color: '#9e9e9e', type: 'stone', feature: '내구성 높은 스톤 질감, 관리 쉬움' },
];

// consultations.status: 'new' | 'contacted' | 'done'
export const STATUS_LABEL = {
  new: '접수 완료',
  contacted: '상담 진행',
  done: '상담 완료',
};
