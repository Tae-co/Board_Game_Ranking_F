import { Users } from 'lucide-react';
import StorageImage from '../StorageImage';
import { V } from '../../utils/cssUtils';
import { getAvatarColorByStr as avatarColor } from '../../utils/avatarUtils';

const AvatarStack = ({ admins = [], memberCount = 0 }) => {
  const visible = admins.slice(0, 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((admin, i) => (
          <div
            key={admin.memberId}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: avatarColor(admin.nickname),
              border: `2px solid var(--th-card)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
              marginLeft: i === 0 ? 0 : -8,
              zIndex: visible.length - i,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {admin.profileImage
              ? <StorageImage src={admin.profileImage} alt={admin.nickname} loading="lazy" decoding="async" transform={{ width: 56, height: 56, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : (admin.nickname || '?')[0].toUpperCase()
            }
          </div>
        ))}
      </div>
      {memberCount > 0 && (
        <span style={{
          fontSize: '12px', fontWeight: '600', color: V('--th-text-sub'),
          backgroundColor: V('--th-bg'),
          border: `1px solid var(--th-border)`,
          borderRadius: '20px', padding: '2px 8px',
        }}>
          +{memberCount > 999 ? `${Math.floor(memberCount / 1000)}k` : memberCount}
        </span>
      )}
    </div>
  );
};

const CommunityCard = ({ community, onEnter, onManage, t }) => (
  <div style={{
    flex: onManage ? '0 0 calc(100% - 40px)' : undefined,
    scrollSnapAlign: onManage ? 'start' : undefined,
    borderRadius: '18px', padding: '18px',
    backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  }}>
    <div style={{ display: 'flex', justifyContent: onManage ? 'space-between' : 'flex-start', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
        backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {community.imageUrl ? (
          <StorageImage src={community.imageUrl} alt={community.name} loading="lazy" decoding="async" transform={{ width: 96, height: 96, quality: 70 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: '800', color: '#fff',
          }}>
            {(community.name || '?')[0].toUpperCase()}
          </div>
        )}
      </div>
      {onManage && (
        <button
          onClick={() => onManage(community)}
          style={{
            fontSize: '12px', fontWeight: '600', color: V('--th-text'),
            backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
            borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
          }}
        >
          {t('community', 'manage')}
        </button>
      )}
    </div>

    <p style={{ fontSize: onManage ? '20px' : '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px' }}>
      {community.name}
    </p>
    <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Users size={13} />
      {community.groupCount} {t('community', 'groups')}
    </p>

    <AvatarStack admins={community.admins ?? []} memberCount={community.memberCount ?? 0} />

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
);

export default CommunityCard;
