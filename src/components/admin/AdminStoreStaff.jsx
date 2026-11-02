import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { assignStoreStaff, getStaffCandidates, unassignStoreStaff } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';

/**
 * 6h STAFF 지정. 후보는 role = STAFF이고 어느 매장에도 지정되지 않은 계정 (역할은 DB에서 직접 준다).
 * 계정 하나 = 매장 하나 — 다른 매장에 있으면 서버가 STAFF_ALREADY_ASSIGNED로 막는다.
 */
const AdminStoreStaff = ({ storeId, staff, closed }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: candidates = [] } = useQuery({
    queryKey: ['adminStaffCandidates'],
    queryFn: getStaffCandidates,
    staleTime: 1000 * 30,
  });

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setCandidateId('');
      queryClient.invalidateQueries({ queryKey: ['adminStores'] });
      queryClient.invalidateQueries({ queryKey: ['adminStaffCandidates'] });
    } catch (e) {
      setError(e?.response?.data?.message || t('admin', 'saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = (member) => {
    if (!window.confirm(t('admin', 'unassignStaffConfirm').replace('{name}', member.nickname))) return;
    run(() => unassignStoreStaff(storeId, member.memberId));
  };

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: V('--th-card'), borderColor: V('--th-border') }}>
      <p className="mb-3 text-sm font-bold" style={{ color: V('--th-text') }}>{t('admin', 'staffTitle')}</p>

      {staff.length === 0 ? (
        <p className="text-sm mb-3" style={{ color: V('--th-text-sub') }}>{t('admin', 'noStaff')}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {staff.map(member => (
            <div key={member.memberId} className="flex items-center justify-between gap-3">
              <span className="truncate text-sm" style={{ color: V('--th-text') }}>{member.nickname}</span>
              <button onClick={() => handleUnassign(member)} disabled={busy} className="text-xs px-3 py-1 rounded-lg border disabled:opacity-50" style={{ color: '#dc2626', borderColor: V('--th-border') }}>
                {t('admin', 'unassignStaff')}
              </button>
            </div>
          ))}
        </div>
      )}

      {!closed && (candidates.length === 0 ? (
        <p className="text-xs" style={{ color: V('--th-text-sub'), lineHeight: 1.5 }}>{t('admin', 'noStaffCandidates')}</p>
      ) : (
        <div className="flex gap-2">
          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{ backgroundColor: V('--th-bg'), borderColor: V('--th-border'), color: V('--th-text') }}
          >
            <option value="">{t('admin', 'staffCandidate')}</option>
            {candidates.map(c => <option key={c.memberId} value={c.memberId}>{c.nickname}</option>)}
          </select>
          <button
            onClick={() => run(() => assignStoreStaff(storeId, candidateId))}
            disabled={!candidateId || busy}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ backgroundColor: V('--th-primary'), color: '#FFFFFF' }}
          >
            {t('admin', 'assignStaff')}
          </button>
        </div>
      ))}

      {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

export default AdminStoreStaff;
