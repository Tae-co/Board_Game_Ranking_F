import { V } from '../../utils/cssUtils';

const JoinCodeSheet = ({ sheetRef, joinCode, setJoinCode, isJoining, onJoin, t }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 50, display: 'flex', alignItems: 'flex-end',
  }}>
    <div
      ref={sheetRef}
      style={{
        width: '100%', maxWidth: '390px', margin: '0 auto',
        backgroundColor: V('--th-card'),
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px',
      }}
    >
      <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: V('--th-border'), margin: '0 auto 24px' }} />

      <h3 style={{ fontSize: '18px', fontWeight: '700', color: V('--th-text'), marginBottom: '6px' }}>
        {t('lobby', 'enterGroupCode')}
      </h3>
      <p style={{ fontSize: '13px', color: V('--th-text-sub'), marginBottom: '20px' }}>
        {t('lobby', 'enterGroupCodeHint')}
      </p>

      <input
        type="text"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && onJoin()}
        placeholder={t('lobby', 'inviteCodePlaceholder')}
        autoFocus
        maxLength={8}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: '12px',
          textAlign: 'center', fontFamily: 'monospace', fontSize: '22px',
          letterSpacing: '0.3em', fontWeight: '700', outline: 'none',
          backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
          color: V('--th-primary'), boxSizing: 'border-box', marginBottom: '12px',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
      />

      <button
        onClick={onJoin}
        disabled={isJoining || !joinCode.trim()}
        style={{
          width: '100%', padding: '15px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          color: '#fff', fontWeight: '700', fontSize: '15px',
          border: 'none', cursor: 'pointer',
          opacity: (isJoining || !joinCode.trim()) ? 0.5 : 1,
        }}
      >
        {isJoining ? '...' : t('lobby', 'joinGroup')}
      </button>
    </div>
  </div>
);

export default JoinCodeSheet;
