import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { assignStoreStaff, getStaffCandidates, unassignStoreStaff } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import AdminSubPage from './AdminSubPage';
import { SearchIcon } from '../store/StoreIcons';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';

const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const listStyle = { backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' };
const pillStyle = { height: 34, padding: '0 12px', borderRadius: 999, fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 };

const formatDay = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Row = ({ memberId, first, name, sub, action }) => (
  <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: '12px', borderTop: first ? 'none' : `1px solid ${V('--th-border')}` }}>
    <MemberDiceAvatar memberId={memberId} nickname={name} size={36} />
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{sub}</span>
    </span>
    {action}
  </div>
);

/**
 * 6h STAFF 지정 (전체 화면). 후보는 role = STAFF이고 어느 매장에도 지정되지 않은 계정 (역할은 DB에서 직접 준다).
 * 계정 하나 = 매장 하나 — 다른 매장에 있으면 서버가 STAFF_ALREADY_ASSIGNED로 막는다.
 */
const AdminStoreStaff = ({ store, staff, onBack }) => {
  const { t } = useLanguage();
  const errorText = useApiErrorMessage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: candidates = [] } = useQuery({
    queryKey: ['adminStaffCandidates'],
    queryFn: getStaffCandidates,
    staleTime: 1000 * 30,
  });

  const needle = search.trim().toLowerCase();
  const shown = needle ? candidates.filter(c => c.nickname.toLowerCase().includes(needle)) : candidates;

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminStores'] }),
        queryClient.invalidateQueries({ queryKey: ['adminStaffCandidates'] }),
      ]);
    } catch (e) {
      setError(errorText(e, t('admin', 'saveFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSubPage title={t('admin', 'assignStaffTitle')} info={t('admin', 'staffInfo')} onBack={onBack} t={t}>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{storeTitle(store)}</span>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={h2Style}>
          {t('admin', 'currentStaff')}{' '}
          <span style={{ fontSize: '14px', fontWeight: 500, color: V('--th-text-sub') }}>{t('admin', 'peopleCount').replace('{n}', staff.length)}</span>
        </h2>
        {staff.length > 0 && (
          <div style={listStyle}>
            {staff.map((member, i) => (
              <Row
                key={member.memberId}
                memberId={member.memberId}
                first={i === 0}
                name={member.nickname}
                sub={t('admin', 'staffAssignedOn').replace('{date}', formatDay(member.assignedAt))}
                action={(
                  <button
                    onClick={() => run(() => unassignStoreStaff(store.id, member.memberId))}
                    disabled={busy}
                    style={{ ...pillStyle, border: '1px solid #FECACA', backgroundColor: V('--th-card'), color: '#DC2626' }}
                  >
                    {t('admin', 'unassignStaff')}
                  </button>
                )}
              />
            ))}
          </div>
        )}
      </section>

      {!store.closed && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={h2Style}>{t('admin', 'addStaff')}</h2>
          <label style={{
            height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px',
            border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'),
            display: 'flex', alignItems: 'center', gap: '10px', color: V('--th-text-sub'),
          }}>
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin', 'staffSearch')}
              aria-label={t('admin', 'staffSearch')}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: V('--th-text') }}
            />
          </label>
          {shown.length > 0 ? (
            <div style={listStyle}>
              {shown.map((c, i) => (
                <Row
                  key={c.memberId}
                  memberId={c.memberId}
                  first={i === 0}
                  name={c.nickname}
                  sub={t('admin', 'staffCandidateSub')}
                  action={(
                    <button
                      onClick={() => run(() => assignStoreStaff(store.id, c.memberId))}
                      disabled={busy}
                      style={{
                        ...pillStyle, border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`,
                        backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`, color: V('--th-primary'),
                      }}
                    >
                      {t('admin', 'assignStaff')}
                    </button>
                  )}
                />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
              {t('admin', needle ? 'noStaffSearchResult' : 'noStaffCandidates')}
            </p>
          )}
        </section>
      )}

      {error && <p style={{ margin: 0, fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>{error}</p>}
    </AdminSubPage>
  );
};

export default AdminStoreStaff;
