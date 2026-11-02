import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { leaveStore } from '../../api/services/stores';
import { MY_STORES_KEY } from '../../hooks/useMyStores';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

/**
 * 1c 매장 나가기 확인. 그룹·대회 줄과 "판이 끝난 뒤에" 막힘은 2·5단계에서 더한다.
 */
const StoreLeaveModal = ({ store, onClose, t }) => {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  const handleLeave = async () => {
    setLeaving(true);
    setError('');
    try {
      await leaveStore(store.id);
      queryClient.invalidateQueries({ queryKey: MY_STORES_KEY });
      queryClient.invalidateQueries({ queryKey: ['stores', 'list'] });
      queryClient.removeQueries({ queryKey: ['store', store.id] });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || t('store', 'leaveFailed'));
      setLeaving(false);
    }
  };

  return (
    <div
      onClick={leaving ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          padding: '28px 24px', width: '100%', maxWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 12px', textAlign: 'center' }}>
          {t('store', 'leaveTitle').replace('{name}', storeTitle(store))}
        </p>
        <ul style={{ margin: '0 0 20px', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {['leaveDesc', 'leaveKeepNote', 'leaveRejoinNote'].map(key => (
            <li key={key} style={{ fontSize: '13px', color: V('--th-text-sub'), lineHeight: 1.5 }}>{t('store', key)}</li>
          ))}
        </ul>
        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={leaving}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: `1px solid ${V('--th-border')}`,
              backgroundColor: V('--th-bg'), color: V('--th-text'),
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
              backgroundColor: '#dc2626', color: '#fff',
              fontSize: '15px', fontWeight: '700', cursor: leaving ? 'not-allowed' : 'pointer',
              opacity: leaving ? 0.7 : 1,
            }}
          >
            {leaving ? '...' : t('store', 'leaveConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreLeaveModal;
