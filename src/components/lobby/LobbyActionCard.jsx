import { V } from '../../utils/cssUtils';

const BASE_SHADOW = '0 1px 4px rgba(0,0,0,0.04)';

/** 커뮤니티 미선택 로비의 두 칸 버튼 (새 그룹 만들기 / 코드로 참가). icon은 그려진 아이콘 요소다. */
const LobbyActionCard = ({ icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '20px 16px', borderRadius: '18px', cursor: 'pointer',
      backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
      textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: BASE_SHADOW,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--th-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,92,231,0.12)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--th-border)'; e.currentTarget.style.boxShadow = BASE_SHADOW; }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: '1.5px solid var(--th-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: '700', fontSize: '14px', color: V('--th-text'), marginBottom: '3px' }}>
        {title}
      </div>
      <div style={{ fontSize: '11px', color: V('--th-text-sub') }}>
        {desc}
      </div>
    </div>
  </button>
);

export default LobbyActionCard;
