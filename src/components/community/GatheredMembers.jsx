import { RefreshCw } from 'lucide-react';
import InitialAvatar from '../shared/InitialAvatar';
import { V } from '../../utils/cssUtils';

const AVATAR_COLORS = ['#6B5CE7', '#F5A623', '#22c55e', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

/**
 * 친구 부르기 화면의 '모인 사람' 카드. 새로 들어온 사람은 튀어나오는 효과, 모자란 자리는 ? 빈자리로 보여 준다.
 * loaded 전에는 인원 수·빈자리를 그리지 않는다 (만든 사람은 항상 멤버라 0명은 틀린 숫자다).
 */
const GatheredMembers = ({ members, loaded, minPlayers, userId, newMemberIds, newcomerName, spinning, onRefresh, t }) => {
  const enough = members.length >= minPlayers;
  return (
    <div style={{
      backgroundColor: V('--th-card'), borderRadius: '20px',
      border: `1px solid var(--th-border)`, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
          {loaded ? t('community', 'onboardMembers').replace('{n}', members.length) : t('common', 'loading')}
        </p>
        <button
          onClick={onRefresh}
          disabled={spinning}
          aria-label={t('community', 'onboardRefresh')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <RefreshCw
            size={18}
            color="var(--th-text-sub)"
            style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }}
          />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px 6px' }}>
        {members.map((member) => {
          const isMe = String(member.memberId) === String(userId);
          return (
            <div key={member.memberId} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: 0,
              animation: newMemberIds.has(member.memberId) ? 'member-pop 0.5s ease-out' : 'none',
            }}>
              <InitialAvatar
                nickname={member.nickname}
                profileImage={member.profileImage}
                size={44}
                fontSize={17}
                color={AVATAR_COLORS[member.memberId % AVATAR_COLORS.length]}
              />
              <span style={{
                fontSize: '10px', fontWeight: isMe ? '700' : '500',
                color: isMe ? V('--th-primary') : V('--th-text'),
                textAlign: 'center', width: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {member.nickname}
              </span>
            </div>
          );
        })}
        {/* 빈자리: 몇 명이 더 와야 하는지 보이게 한다 */}
        {loaded && Array.from({ length: Math.max(0, minPlayers - members.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', boxSizing: 'border-box',
              border: `2px dashed var(--th-border)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, color: V('--th-text-sub'),
            }}>
              ?
            </div>
            <span style={{ fontSize: '10px', color: V('--th-text-sub') }}>{t('community', 'onboardEmptySeat')}</span>
          </div>
        ))}
      </div>

      {loaded && !enough && (
        <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: '14px 0 0', textAlign: 'center' }}>
          {t('community', 'onboardNeedFriend')}
        </p>
      )}

      {newcomerName && (
        <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-primary'), margin: '14px 0 0', textAlign: 'center' }}>
          {t('community', 'onboardNewMember').replace('{name}', newcomerName)}
        </p>
      )}
    </div>
  );
};

export default GatheredMembers;
