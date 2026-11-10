import { Users, X } from 'lucide-react';
import StorageImage from '../StorageImage';
import DiceAvatar from '../shared/DiceAvatar';
import { V } from '../../utils/cssUtils';
import { getAvatarColorByStr as avatarColor } from '../../utils/avatarUtils';
import { useTheme } from '../../theme/ThemeContext';

// 사진 아래 흰 시트의 위쪽 경계에 걸쳐 놓인다
const AvatarStack = ({ admins = [], memberCount = 0 }) => {
  const { themeKey } = useTheme();
  const visible = admins.slice(0, 3);
  return (
    <div style={{ position: 'absolute', top: -16, left: 16, display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((admin, i) => (
          <div
            key={admin.memberId}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: avatarColor(admin.nickname),
              border: `3px solid ${V('--th-card')}`,
              boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: '#fff',
              marginLeft: i === 0 ? 0 : -9,
              zIndex: visible.length - i,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {admin.profileImage
              ? <StorageImage src={admin.profileImage} alt={admin.nickname} loading="lazy" decoding="async" transform={{ width: 64, height: 64, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <DiceAvatar size={32} />
            }
          </div>
        ))}
      </div>
      {memberCount > 0 && (
        <span style={{
          fontSize: '12px', fontWeight: '700',
          // 다크에서는 보라 글씨가 어두운 칩 위에서 묻힌다
          color: themeKey === 'ledger' ? '#fff' : V('--th-primary'),
          backgroundColor: V('--th-card'),
          border: `1px solid ${V('--th-border')}`,
          borderRadius: '20px', padding: '3px 9px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          +{memberCount > 999 ? `${Math.floor(memberCount / 1000)}k` : memberCount}
        </span>
      )}
    </div>
  );
};

const CommunityCard = ({ community, onEnter, onManage, onLeave, isCarousel, t }) => (
  <div style={{
    flex: isCarousel ? '0 0 calc(100% - 40px)' : undefined,
    scrollSnapAlign: isCarousel ? 'start' : undefined,
    borderRadius: '18px', overflow: 'hidden',
    backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  }}>
    {/* 사진은 효과 없이 그대로 보여주고, 글씨는 전부 아래 시트 위에 둔다 */}
    <div style={{ position: 'relative', height: 170, backgroundColor: '#2a1f6e' }}>
      {community.imageUrl ? (
        <StorageImage src={community.imageUrl} alt={community.name} loading="lazy" decoding="async" transform={{ width: 700, height: 340, quality: 72 }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        // 사진 없이 만든 모임은 로비 히어로 카드처럼 앱 로고를 기본 사진으로 쓴다
        <img src="/logo.png" alt={community.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      {onManage && (
        <button
          onClick={() => onManage(community)}
          style={{
            // 나가기 X가 있으면 그 왼쪽으로 비켜 선다
            position: 'absolute', top: 12, right: onLeave ? 44 : 12,
            fontSize: '12px', fontWeight: '700', color: V('--th-text'),
            backgroundColor: V('--th-card'), border: 'none',
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {t('community', 'manage')}
        </button>
      )}
      {/* 매장 카드의 나가기 X와 같은 모양 */}
      {onLeave && (
        <button
          aria-label={t('community', 'leaveAria').replace('{name}', community.name)}
          onClick={() => onLeave(community)}
          style={{
            position: 'absolute', top: 12, right: 12, width: 24, height: 24, padding: 0,
            border: 'none', borderRadius: 999, cursor: 'pointer',
            backgroundColor: 'rgba(17,24,39,0.55)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      )}
    </div>

    <div style={{
      position: 'relative', marginTop: -22,
      backgroundColor: V('--th-card'), borderRadius: '18px 18px 0 0',
      padding: '26px 16px 16px',
    }}>
      <AvatarStack admins={community.admins ?? []} memberCount={community.memberCount ?? 0} />

      <p style={{ fontSize: '19px', fontWeight: '800', color: V('--th-text'), margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {community.name}
      </p>
      <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Users size={13} />
        {community.groupCount} {t('community', 'groups')}
      </p>

      <button
        onClick={() => onEnter(community)}
        style={{
          width: '100%', padding: '13px',
          borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          color: '#fff', fontSize: '15px', fontWeight: '700',
        }}
      >
        {t('community', 'enterCommunity')}
      </button>
    </div>
  </div>
);

export default CommunityCard;
