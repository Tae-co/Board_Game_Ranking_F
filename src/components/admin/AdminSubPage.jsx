import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import { BackIcon, InfoIcon } from '../store/StoreIcons';

const buttonStyle = (kind) => ({
  height: 48, borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  ...(kind === 'danger' && { border: 'none', backgroundColor: '#DC2626', color: '#fff' }),
  ...(kind === 'ghost' && { border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text') }),
  ...(!kind && { border: 'none', backgroundColor: V('--th-primary'), color: '#fff' }),
});

/** 어드민 매장 시안의 팝업 (알아 두세요 · 저장했어요 · 운영 끝내기 확인). actions: [{ label, onClick, kind?: 'danger' | 'ghost' }] */
export const AdminPopup = ({ title, children, onDismiss, actions }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 220 }}>
    <div onClick={onDismiss} style={{ position: 'absolute', inset: 0 }} />
    <div role="dialog" aria-modal="true" style={{
      position: 'absolute', top: 160, left: 24, right: 24, maxWidth: 382, margin: '0 auto',
      backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '20px',
      boxShadow: '0 16px 40px rgba(17,24,39,0.18)', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{title}</h2>
      <span style={{ fontSize: '14px', lineHeight: 1.7, color: V('--th-text-sub'), whiteSpace: 'pre-line' }}>{children}</span>
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick} style={buttonStyle(a.kind)}>{a.label}</button>
      ))}
    </div>
  </div>
);

/**
 * 어드민 매장 하위 화면 (시안 6e · 6f · 6h): 위쪽 뒤로 · 제목 · ! 버튼(알아 두세요), 아래로 내용.
 * 규칙 설명은 화면에 두지 않고 ! 팝업으로 (plan-store §2)
 */
const AdminSubPage = ({ title, info, onBack, t, children }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflowY: 'auto', backgroundColor: V('--th-bg') }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 1, paddingTop: 'env(safe-area-inset-top)',
        backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}`,
      }}>
        <div style={{ maxWidth: 430, margin: '0 auto', height: 56, boxSizing: 'border-box', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} aria-label={t('common', 'back')} style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: V('--th-text') }}>
            <BackIcon />
          </button>
          <span style={{ fontSize: '17px', fontWeight: 700, color: V('--th-primary') }}>{title}</span>
          <button onClick={() => setInfoOpen(true)} aria-label={t('admin', 'infoAria')} aria-expanded={infoOpen} style={{ width: 44, height: 44, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: V('--th-text-sub') }}>
            <InfoIcon />
          </button>
        </div>
      </header>
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '16px 20px calc(40px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </main>
      {infoOpen && (
        <AdminPopup
          title={t('admin', 'infoTitle')}
          onDismiss={() => setInfoOpen(false)}
          actions={[{ label: t('admin', 'infoOk'), onClick: () => setInfoOpen(false) }]}
        >
          {info}
        </AdminPopup>
      )}
    </div>
  );
};

export default AdminSubPage;
