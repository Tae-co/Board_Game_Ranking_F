import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoreHome, leaveStore } from '../../api/services/stores';
import { MY_STORES_KEY } from '../../hooks/useMyStores';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

/**
 * 1c 매장 나가기 확인. 신청한 대회·진행 중 대회가 있으면 줄을 더한다 (매장 홈 응답의 대회 카드).
 * 점수·순위·경기 수 숫자와 그룹 줄은 아직 없다. "판이 끝난 뒤에" 막힘은 서버 오류 문구로 보여 준다
 */
const StoreLeaveModal = ({ store, onClose, t }) => {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const { data: home } = useQuery({
    queryKey: ['store', store.id, 'home'],
    queryFn: () => getStoreHome(store.id),
    staleTime: 1000 * 30,
  });
  const contestLines = (home?.contests ?? [])
    .filter(c => (c.myStatus === 'APPLIED' && c.status === 'RECRUITING') || (c.myStatus === 'PLAYING' && c.status === 'PLAYING'))
    .map(c => t('contest', c.status === 'PLAYING' ? 'leaveLive' : 'leaveApplied').replace('{title}', c.title));

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

  const buttonStyle = {
    flex: 1, height: 48, borderRadius: '12px', border: 'none',
    fontSize: '15px', fontWeight: 700,
  };

  return (
    <div
      onClick={leaving ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px', boxSizing: 'border-box',
          padding: '24px', width: '100%', maxWidth: '342px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 id="leave-title" style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
            {t('store', 'leaveTitle').replace('{name}', storeTitle(store))}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: V('--th-text-sub') }}>{t('store', 'leaveDesc')}</p>
        </div>
        <ul style={{
          margin: 0, padding: '14px 16px', listStyle: 'none', borderRadius: '12px',
          backgroundColor: 'rgba(220,38,38,0.08)', color: '#DC2626',
          display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px',
        }}>
          {['leaveItemScore', 'leaveItemRank', 'leaveItemMatches'].map(key => <li key={key}>{t('store', key)}</li>)}
          {contestLines.map(line => <li key={line}>{line}</li>)}
        </ul>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', 'leaveKeepNote')}</p>
        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0, textAlign: 'center' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={leaving}
            style={{ ...buttonStyle, cursor: 'pointer', backgroundColor: V('--th-bg-deep'), color: V('--th-text') }}
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{
              ...buttonStyle, backgroundColor: '#DC2626', color: '#fff',
              cursor: leaving ? 'not-allowed' : 'pointer', opacity: leaving ? 0.7 : 1,
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
