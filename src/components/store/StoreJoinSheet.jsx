import { useState } from 'react';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const CONSENTS = ['consentNickname', 'consentStats'];

const CheckBox = ({ on }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="22" height="22" rx="6"
      fill={on ? V('--th-primary') : 'none'}
      stroke={on ? 'none' : V('--th-border')} strokeWidth="2" />
    {on && <path d="M7 12l3.5 3.5L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

/**
 * 1b 매장 가입 동의. 필수 두 항목을 다 체크해야 가입된다. 동의하지 않으면 매장에 들어가지 않는다.
 */
const StoreJoinSheet = ({ store, joining, error, onConfirm, onCancel, t }) => {
  const [checked, setChecked] = useState({});
  const allChecked = CONSENTS.every(key => checked[key]);
  const disabled = !allChecked || joining;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(17,24,39,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div role="dialog" aria-label={t('store', 'joinTitle').replace('{name}', storeTitle(store))} style={{
        backgroundColor: V('--th-card'), width: '100%', maxWidth: '430px', boxSizing: 'border-box',
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px calc(32px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, backgroundColor: V('--th-border') }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>
            {t('store', 'joinTitle').replace('{name}', storeTitle(store))}
          </h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'joinDesc')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {CONSENTS.map(key => (
            <label
              key={key}
              style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 0', cursor: 'pointer',
                borderTop: `1px solid ${V('--th-border')}`,
              }}
            >
              <input
                type="checkbox"
                checked={!!checked[key]}
                onChange={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <CheckBox on={!!checked[key]} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{t('store', `${key}Title`)}</span>
                <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', `${key}Desc`)}</span>
              </span>
            </label>
          ))}
        </div>

        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0, textAlign: 'center' }}>{error}</p>}

        <button
          onClick={onConfirm}
          disabled={disabled}
          style={{
            height: 52, borderRadius: '14px', border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: V('--th-primary'), opacity: disabled ? 0.4 : 1,
            color: '#fff', fontSize: '16px', fontWeight: 700,
          }}
        >
          {joining ? '...' : t('store', 'joinConfirm')}
        </button>
        <button
          onClick={onCancel}
          disabled={joining}
          style={{
            height: 44, border: 'none', background: 'none', cursor: 'pointer',
            color: V('--th-text-sub'), fontSize: '14px',
          }}
        >
          {t('common', 'cancel')}
        </button>
        <span style={{ textAlign: 'center', fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>
          {t('store', 'joinFootnote')}
        </span>
      </div>
    </div>
  );
};

export default StoreJoinSheet;
