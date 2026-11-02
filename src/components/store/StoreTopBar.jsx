import { useNavigate } from 'react-router-dom';
import { getNickname } from '../../auth/storage';
import { V } from '../../utils/cssUtils';
import { BackIcon } from './StoreIcons';

/** 매장 화면 위쪽 막대 (시안 1f·1g·2·2m·3b~3n): 뒤로 · 가운데 제목 · 오른쪽 프로필 또는 right(! 버튼·게임 취소 등) */
const StoreTopBar = ({ title, onBack, showProfile = false, backLabel, right = null }) => {
  const navigate = useNavigate();
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top)',
      backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}`,
    }}>
      <div style={{
        maxWidth: 430, margin: '0 auto', height: 56, boxSizing: 'border-box', padding: '0 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={onBack}
          aria-label={backLabel}
          style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: V('--th-text') }}
        >
          <BackIcon />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: V('--th-primary') }}>{title}</span>
        {right ?? (showProfile ? (
          <button
            onClick={() => navigate('/profile')}
            aria-label="profile"
            style={{
              width: 40, height: 40, marginRight: 2, borderRadius: 999, border: 'none', cursor: 'pointer',
              backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700,
            }}
          >
            {(getNickname() || '?')[0]}
          </button>
        ) : (
          <span style={{ width: 44 }} />
        ))}
      </div>
    </header>
  );
};

export default StoreTopBar;
