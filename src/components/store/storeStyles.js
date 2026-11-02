import { V } from '../../utils/cssUtils';

const badge = (bg, color) => ({ fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 999, backgroundColor: bg, color, flexShrink: 0 });

/** 기록자 배지 (시안 2i·3b·3d) */
export const recorderBadge = badge('#FFF1E6', '#B4500A');
/** 나 배지 */
export const meBadge = badge(V('--th-primary'), '#fff');

export const card = { backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px' };

export const sectionTitle = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };

export const page = { maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' };

/** 하단 고정 막대의 큰 버튼 (시안 3·3b·3d~3n). enabled가 false면 회색 */
export const primaryButton = (enabled = true) => ({
  height: 56, border: 'none', borderRadius: '16px', cursor: enabled ? 'pointer' : 'default',
  backgroundColor: enabled ? V('--th-primary') : V('--th-border'), color: enabled ? '#fff' : V('--th-text-sub'),
  fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
});

export const ghostButton = {
  height: 52, borderRadius: '14px', cursor: 'pointer', border: `1px solid ${V('--th-border')}`,
  backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '16px', fontWeight: 700,
};

export const hintText = { textAlign: 'center', fontSize: '12px', color: V('--th-text-sub') };
