import { Play } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/**
 * 화면 아래 고정 버튼. 멤버면 게임 시작, 아직 참가하지 않았으면 같은 자리에 참가하기.
 * 라벨은 버튼이 실제로 할 수 있는 일만 말해야 한다 — '시작'이라 써 놓고 안 눌리면 사용자가 막힌다.
 */
const StartGameBar = ({ isMember, onJoin, isJoining, joinDisabled, onStart, canStart, overMax, label, t }) => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
    <div style={{ maxWidth: 390, margin: '0 auto', padding: '10px 20px calc(28px + env(safe-area-inset-bottom))' }}>
      {!isMember ? (
        <button
          onClick={onJoin}
          disabled={joinDisabled}
          style={{
            width: '100%', padding: '15px', borderRadius: '50px',
            cursor: isJoining ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            border: 'none',
            opacity: isJoining ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
          }}
        >
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
            {isJoining ? '...' : t('invite', 'joinRoom')}
          </span>
        </button>
      ) : (
        <button
          onClick={onStart}
          style={{
            width: '100%', padding: '15px', borderRadius: '50px',
            cursor: 'pointer',
            background: canStart
              ? 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)'
              : overMax ? '#ef4444' : V('--th-border'),
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: canStart ? '0 4px 16px rgba(107, 92, 231, 0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {canStart && <Play style={{ color: '#FFFFFF', width: 18, height: 18, fill: '#FFFFFF' }} />}
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
            {label}
          </span>
        </button>
      )}
    </div>
  </div>
);

export default StartGameBar;
