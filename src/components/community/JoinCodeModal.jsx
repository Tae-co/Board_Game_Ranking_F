import { V } from '../../utils/cssUtils';

/** 초대 코드로 커뮤니티 참가 — 코드 입력 창. 바깥을 누르면 닫힌다. 입력은 대문자로 바꾼다. */
const JoinCodeModal = ({ joinCode, onCodeChange, error, loading, onSubmit, onClose, t }) => {
  const disabled = loading || !joinCode.trim();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          padding: '28px 24px', width: '100%', maxWidth: '360px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 6px' }}>
          {t('community', 'joinCommunity')}
        </p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 20px' }}>
          {t('community', 'enterInviteCode')}
        </p>
        <input
          autoFocus
          value={joinCode}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="AB12CD"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px 16px', borderRadius: '12px',
            border: `1px solid ${error ? '#ef4444' : 'var(--th-border)'}`,
            backgroundColor: V('--th-bg'), color: V('--th-text'),
            fontSize: '20px', fontWeight: '700', letterSpacing: '0.15em',
            outline: 'none', textAlign: 'center', marginBottom: '8px',
          }}
        />
        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
        )}
        <button
          onClick={onSubmit}
          disabled={disabled}
          style={{
            width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
            marginTop: error ? 0 : '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: disabled
              ? 'var(--th-border)'
              : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: '16px', fontWeight: '700',
          }}
        >
          {loading ? '...' : t('community', 'joinWithCodeBtn')}
        </button>
      </div>
    </div>
  );
};

export default JoinCodeModal;
