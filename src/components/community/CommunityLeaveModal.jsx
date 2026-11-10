import { useState } from 'react';
import { leaveCommunity } from '../../api/services/communities';
import { V } from '../../utils/cssUtils';
import { useTheme } from '../../theme/ThemeContext';

/**
 * 커뮤니티 나가기 확인 (캔버스 UI-CommunityLeave · UI-DarkCommunityLeave).
 * 방장 줄은 카드에 방장 여부가 없어 늘 보여 준다 — "방장인 그룹은 …"이라 방장이 아니어도 틀리지 않는다.
 */
const CommunityLeaveModal = ({ community, onClose, onLeft, t }) => {
  const { themeKey } = useTheme();
  const dark = themeKey === 'ledger';
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  const handleLeave = async () => {
    setLeaving(true);
    setError('');
    try {
      await leaveCommunity(community.communityId);
      onLeft(community);
    } catch (e) {
      setError(e?.response?.data?.message || t('community', 'leaveFailed'));
      setLeaving(false);
    }
  };

  const buttonStyle = {
    flex: 1, height: 48, borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  };

  return (
    <div
      onClick={leaving ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-leave-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px', boxSizing: 'border-box',
          padding: '24px', width: '100%', maxWidth: '342px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 id="community-leave-title" style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
            {t('community', 'leaveTitle').replace('{name}', community.name)}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: dark ? '#CBD5E1' : '#4B5563' }}>
            {t('community', 'leaveDesc')}
          </p>
        </div>
        <ul style={{
          margin: 0, padding: '14px 16px', listStyle: 'none', borderRadius: '12px',
          backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', color: dark ? '#FCA5A5' : '#991B1B',
          display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px',
        }}>
          <li>{t('community', 'leaveGroups')}</li>
          <li>{t('community', 'leaveScores')}</li>
          <li>{t('community', 'leaveHost')}</li>
        </ul>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
          {t('community', 'leaveAnonymous')}
        </p>
        {error && <p role="alert" style={{ margin: 0, fontSize: '13px', color: '#DC2626' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={leaving}
            style={{
              ...buttonStyle,
              backgroundColor: dark ? V('--th-bg') : '#F3F4F6',
              border: dark ? `1px solid ${V('--th-border')}` : 'none',
              color: dark ? V('--th-text') : '#374151',
            }}
          >
            {t('community', 'leaveCancel')}
          </button>
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{ ...buttonStyle, backgroundColor: '#DC2626', color: '#FFFFFF', opacity: leaving ? 0.6 : 1 }}
          >
            {t('community', 'leaveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityLeaveModal;
