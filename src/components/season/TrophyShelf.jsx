import MedalBadge from '../shared/MedalBadge';
import { V } from '../../utils/cssUtils';
import { seasonLabel } from '../../utils/seasonUtils';
import ExampleBadge from '../practice/ExampleBadge';

/**
 * 프로필 트로피 선반 (기획 §6). 가로 스크롤 한 줄로 `🥇 카탄 · 가을 리그`처럼 놓는다.
 *
 * 비어 있으면 호출부가 아예 렌더하지 않는다 — "아직 트로피가 없어요"는 빈 서랍을 강조할 뿐이다.
 * 자격 필터(참가자 3명·본인 3경기)는 서버가 이미 적용해서 준다.
 */
const TrophyShelf = ({ trophies, t }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: V('--th-text-sub'),
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {t('season', 'trophyShelf')}
      </span>
      {/* 연습 트로피는 시즌이 끝나기 전에 미리 보여 주는 것이다 */}
      {trophies.some(tr => tr.isExample) && <ExampleBadge t={t} />}
    </div>
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {trophies.map((trophy) => (
        <div
          key={`${trophy.seasonId}-${trophy.boardGameId}`}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 12px', borderRadius: 12,
            backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
          }}
        >
          <MedalBadge place={trophy.rank} size={20} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: V('--th-text'), whiteSpace: 'nowrap' }}>
              {trophy.boardGameName}
            </div>
            <div style={{ fontSize: 10, color: V('--th-text-sub'), whiteSpace: 'nowrap' }}>
              {seasonLabel({ name: trophy.seasonName, seasonNumber: trophy.seasonNumber }, t)} · {trophy.roomName}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TrophyShelf;
