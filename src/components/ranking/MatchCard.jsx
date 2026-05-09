import InitialAvatar from '../shared/InitialAvatar';
import { V } from '../../utils/cssUtils';
import { formatDate, formatTime, ordinalSuffix } from '../../utils/dateUtils';

const MatchCard = ({ match, myUserId, communityTimezone, isHost, onView, onEdit, onDelete }) => {
  const myParticipant = match.participants?.find(p => p.memberId === myUserId);
  const isVictory = myParticipant?.placement === 1;
  const ratingChange = myParticipant?.ratingChange ?? 0;
  const ratingSign = ratingChange >= 0 ? '+' : '';
  const visibleParticipants = (match.participants || []).slice(0, 3);
  const extraCount = (match.participants?.length || 0) - 3;
  const hasScoreData = match.participants?.some(p => p.scoresJson);
  const resultColor = isVictory ? '#16a34a' : '#dc2626';
  const resultLabel = isVictory ? 'VICTORY' : `${ordinalSuffix(myParticipant?.placement ?? 0)} PLACE`;

  return (
    <div style={{ borderRadius: 16, padding: '14px 16px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{formatDate(match.playedAt, communityTimezone)}</div>
          <div style={{ fontSize: 11, color: V('--th-text-sub'), marginTop: 2 }}>{formatTime(match.playedAt, communityTimezone)} · {match.participants?.length || 0} Players</div>
        </div>
        {myParticipant && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: resultColor, lineHeight: 1 }}>
              {ratingSign}{Math.round(ratingChange)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: resultColor, marginTop: 2 }}>
              {resultLabel}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          {visibleParticipants.map((p, i) => (
            <div key={p.memberId} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: visibleParticipants.length - i, position: 'relative' }}>
              <InitialAvatar nickname={p.nickname} profileImage={p.profileImage} size={36} fontSize={14} />
              {p.placement === 1 && (
                <div style={{ position: 'absolute', top: -8, left: -2, fontSize: 13, lineHeight: 1 }}>👑</div>
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <div style={{ marginLeft: -10, width: 36, height: 36, borderRadius: '50%', background: V('--th-border'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), zIndex: 0 }}>
              +{extraCount}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {hasScoreData && (
            <button onClick={() => onView(match)} style={{ fontSize: 12, fontWeight: 600, color: V('--th-primary'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Details ›
            </button>
          )}
          {isHost && (
            <div style={{ display: 'flex', gap: 8 }}>
              {hasScoreData && (
                <button onClick={() => onEdit(match)} style={{ fontSize: 10, fontWeight: 600, color: V('--th-text-sub'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>
              )}
              <button onClick={() => onDelete(match.matchId)} style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>삭제</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
