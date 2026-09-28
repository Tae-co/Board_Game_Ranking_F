import MedalBadge from '../shared/MedalBadge';
import InitialAvatar from '../shared/InitialAvatar';
import { V } from '../../utils/cssUtils';

/**
 * 지난 시즌 1·2·3등 시상대.
 *
 * 서버가 자격을 통과한 행만 준다 — 참가자 3명 미만 시즌은 빈 배열이고, 본인 경기 수가
 * 모자란 사람은 빠져 있다(기획 §4). 그래서 여기서는 조건을 다시 판단하지 않는다.
 * 동점은 같은 순위를 받으므로 rank가 중복될 수 있다 (1, 2, 2).
 */
const SeasonPodium = ({ entries, myUserId, t }) => {
  if (entries.length === 0) return null;

  return (
    <div style={{
      borderRadius: 14, padding: '14px 12px', backgroundColor: V('--th-card'),
      border: `1px solid var(--th-border)`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: V('--th-text-sub'),
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
      }}>
        {t('season', 'podium')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: 6 }}>
        {entries.map((entry) => {
          const isMe = entry.memberId === myUserId;
          return (
            <div
              key={`${entry.rank}-${entry.memberId}`}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <MedalBadge place={entry.rank} size={26} />
              <InitialAvatar nickname={entry.nickname} profileImage={entry.profileImage} size={34} fontSize={13} />
              <div style={{
                fontSize: 12, fontWeight: isMe ? 800 : 600, maxWidth: '100%',
                color: isMe ? 'var(--th-primary)' : V('--th-text'),
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.nickname}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--th-primary)' }}>
                {Math.round(entry.displayScore).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonPodium;
