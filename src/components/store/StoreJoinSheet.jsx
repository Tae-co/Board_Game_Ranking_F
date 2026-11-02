import { useState } from 'react';
import { Check } from 'lucide-react';
import StoreThumb from './StoreThumb';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const CONSENTS = ['consentNickname', 'consentStats'];

/**
 * 1b 매장 가입 동의. 필수 두 항목을 다 체크해야 가입된다. 동의하지 않으면 매장에 들어가지 않는다.
 */
const StoreJoinSheet = ({ store, joining, error, onConfirm, onCancel, t }) => {
  const [checked, setChecked] = useState({});
  const allChecked = CONSENTS.every(key => checked[key]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: V('--th-card'), width: '100%', maxWidth: '430px',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px calc(20px + env(safe-area-inset-bottom))',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <StoreThumb store={store} size={48} radius={12} />
          <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: 0, lineHeight: 1.35 }}>
            {t('store', 'joinTitle').replace('{name}', storeTitle(store))}
          </p>
        </div>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 16px', lineHeight: 1.5 }}>
          {t('store', 'joinDesc')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {CONSENTS.map(key => {
            const on = !!checked[key];
            return (
              <button
                key={key}
                onClick={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
                  padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                  backgroundColor: V('--th-bg'),
                  border: `1px solid ${on ? V('--th-primary') : V('--th-border')}`,
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '6px', flexShrink: 0, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? V('--th-primary') : 'transparent',
                  border: `1.5px solid ${on ? V('--th-primary') : V('--th-border')}`,
                }}>
                  {on && <Check size={13} color="#fff" strokeWidth={3} />}
                </span>
                <span style={{ fontSize: '13px', color: V('--th-text'), lineHeight: 1.5 }}>
                  <b style={{ color: V('--th-primary'), marginRight: 4 }}>{t('store', 'required')}</b>
                  {t('store', key)}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={joining}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${V('--th-border')}`,
              backgroundColor: V('--th-bg'), color: V('--th-text'),
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked || joining}
            style={{
              flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
              cursor: !allChecked || joining ? 'not-allowed' : 'pointer',
              background: !allChecked || joining ? V('--th-border') : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: '15px', fontWeight: '700',
            }}
          >
            {joining ? '...' : t('store', 'joinConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreJoinSheet;
