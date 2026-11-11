import { V } from '../../utils/cssUtils';

/** 프로필 카드 안 닉네임 바꾸기 입력 (useNicknameEdit의 반환값을 받는다) */
const NicknameEditor = ({ edit, onSave, t }) => {
  const { nickname, onChange, status, hint, canSave, isSaving } = edit;
  return (
    <div style={{ width: '100%' }}>
      <input
        type="text"
        value={nickname}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder={t('profile', 'nicknamePlaceholder')}
        maxLength={20}
        autoFocus
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, outline: 'none',
          backgroundColor: V('--th-bg'), color: V('--th-text'), boxSizing: 'border-box', marginBottom: 4,
          border: `1.5px solid ${status === 'ok' ? '#16a34a' : status === 'taken' ? '#dc2626' : 'var(--th-border)'}`,
        }}
      />
      {hint && (
        <p style={{ fontSize: 12, marginBottom: 8, color: hint.color, paddingLeft: 4 }}>{hint.text}</p>
      )}
      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 50, border: 'none',
          cursor: canSave ? 'pointer' : 'not-allowed',
          backgroundColor: 'var(--th-primary)', color: '#fff', fontSize: 14, fontWeight: 700,
          opacity: canSave && !isSaving ? 1 : 0.4,
        }}
      >
        {isSaving ? t('profile', 'savingNickname') : t('profile', 'saveNickname')}
      </button>
    </div>
  );
};

export default NicknameEditor;
