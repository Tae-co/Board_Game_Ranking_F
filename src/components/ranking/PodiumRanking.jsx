import StorageImage from '../StorageImage';
import MedalBadge from '../shared/MedalBadge';
import { V } from '../../utils/cssUtils';

const PODIUM_CONFIG = [
  { place: 2, size: 70, avatarSize: 58, podiumOffset: 0, medalOffset: -6 },
  { place: 1, size: 90, avatarSize: 82, ring: '#FFD700', podiumOffset: 36, medalOffset: -1 },
  { place: 3, size: 60, avatarSize: 50, podiumOffset: 0, medalOffset: -4 },
];

const PodiumRanking = ({ rankings, myUserId }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
    {PODIUM_CONFIG.map(({ place, size, avatarSize, ring, podiumOffset, medalOffset }) => {
      const rank = rankings[place - 1];
      if (!rank) return <div key={place} style={{ flex: 1 }} />;
      const isMe = rank.memberId === myUserId;
      return (
        <div key={rank.memberId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: podiumOffset }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: avatarSize, height: avatarSize, borderRadius: '50%',
              backgroundColor: V('--th-primary'), color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: Math.round(avatarSize * 0.3),
              border: ring ? `3px solid ${ring}` : 'none',
              boxSizing: 'border-box', overflow: 'hidden',
            }}>
              {rank.profileImage
                ? <StorageImage src={rank.profileImage} alt={rank.nickname} loading="lazy" decoding="async" transform={{ width: avatarSize * 2, height: avatarSize * 2, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : (rank.nickname || '?')[0].toUpperCase()
              }
            </div>
            <div style={{ position: 'absolute', bottom: medalOffset, right: medalOffset }}>
              <MedalBadge place={place} size={avatarSize > 56 ? 26 : 22} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: size }}>
              {rank.nickname}
            </div>
            <div style={{ fontSize: 13, color: ring ? '#FFD700' : V('--th-text'), fontWeight: 800 }}>
              {Math.round(rank.rating).toLocaleString()}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default PodiumRanking;
