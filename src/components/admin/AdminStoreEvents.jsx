import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAdminStoreContest, deleteAdminStoreEvent, getAdminStoreContests, getAdminStoreEvents } from '../../api/services/admin';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { AdminPopup } from './AdminSubPage';
import AdminEventForm from './AdminEventForm';
import { fmt } from '../store/fmt';
import { PILL, pill, shortDate } from '../contest/contestUtils';

const STATUS_PILL = { RECRUITING: PILL.orange, PLAYING: PILL.green, FINISHED: PILL.gray, CANCELLED: PILL.red };
const rowLink = {
  display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
  backgroundColor: V('--th-bg'), textAlign: 'left', width: '100%',
};
const smallButton = (danger) => ({
  height: 32, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontSize: '12px', fontWeight: 700,
  border: `1px solid ${danger ? '#FECACA' : V('--th-border')}`, backgroundColor: V('--th-card'), color: danger ? '#B91C1C' : V('--th-text'),
});

/** "2026-11-28" "13:00" → 11/28 13:00 */
const contestWhenAdmin = (c) => `${shortDate(c.date)} ${c.time}`;

/**
 * 6 어드민 매장 탭의 "이벤트" 칸: 하루 대회·매장 이벤트 목록(줄마다 수정 → 6j / 삭제 확인창) + "+ 이벤트 등록" → 6j.
 * 끝났거나 취소된 대회는 목록에서 뺀다 (기록은 대회 화면·리포트에서). eventsOnly = 6k의 매장 이벤트 목록
 */
const AdminStoreEvents = ({ store, eventsOnly = false }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // { contest } | { event } | {}
  const [deleting, setDeleting] = useState(null);

  const { data: contests = [] } = useQuery({ queryKey: ['adminStoreContests', store.id], queryFn: () => getAdminStoreContests(store.id) });
  const { data: events = [] } = useQuery({ queryKey: ['adminStoreEvents', store.id], queryFn: () => getAdminStoreEvents(store.id) });
  const shownContests = eventsOnly ? [] : contests.filter(c => c.status === 'RECRUITING' || c.status === 'PLAYING');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminStoreContests', store.id] });
    queryClient.invalidateQueries({ queryKey: ['adminStoreEvents', store.id] });
    queryClient.invalidateQueries({ queryKey: ['adminStoreRooms', store.id] });
    queryClient.invalidateQueries({ queryKey: ['store', store.id] });
    queryClient.invalidateQueries({ queryKey: ['adminTvSetting', store.id] });
  };
  const remove = async () => {
    if (deleting.contest) await deleteAdminStoreContest(store.id, deleting.contest.id);
    else await deleteAdminStoreEvent(store.id, deleting.event.id);
    setDeleting(null);
    refresh();
  };

  return (
    <section style={{
      backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
      padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('contest', eventsOnly ? 'kindEvent' : 'adminEvents')}</h2>
        <button onClick={() => setEditing({})} style={{ height: 36, padding: '0 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '13px', fontWeight: 700 }}>
          {t('contest', 'adminAdd')}
        </button>
      </div>
      {shownContests.length === 0 && events.length === 0 && (
        <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('contest', 'adminEmpty')}</span>
      )}
      {shownContests.map(c => (
        <div key={`c${c.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => navigate(`/store/${store.id}/contest/${c.id}`)} style={rowLink}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{c.title}</span>
              <span style={pill(STATUS_PILL[c.status])}>{t('contest', `status${c.status}`)}</span>
            </span>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
              {fmt(t('contest', 'adminContestLine'), { when: contestWhenAdmin(c), a: c.applied, b: c.capacity, r: c.rounds })}
              {c.roomClosed ? ` · ${t('contest', 'badgeRoomClosed')}` : ''}
            </span>
          </button>
          {c.status === 'RECRUITING' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setEditing({ contest: c })} style={smallButton(false)}>{t('contest', 'edit')}</button>
              <button onClick={() => setDeleting({ contest: c })} style={smallButton(true)}>{t('contest', 'delete')}</button>
            </div>
          )}
        </div>
      ))}
      {events.map(e => (
        <div key={`e${e.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => navigate(`/store/${store.id}`)} style={rowLink}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{e.title}</span>
              <span style={pill(e.active ? PILL.blue : PILL.gray)}>{t('contest', e.active ? 'badgeStoreEvent' : 'adminEventUpcoming')}</span>
            </span>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
              {fmt(t('contest', 'adminEventLine'), { from: shortDate(e.startsOn), to: shortDate(e.endsOn) })}
            </span>
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setEditing({ event: e })} style={smallButton(false)}>{t('contest', 'edit')}</button>
            <button onClick={() => setDeleting({ event: e })} style={smallButton(true)}>{t('contest', 'delete')}</button>
          </div>
        </div>
      ))}

      {editing && (
        <AdminEventForm store={store} contest={editing.contest} event={editing.event} defaultKind={eventsOnly ? 'event' : 'contest'} onBack={() => setEditing(null)} onSaved={refresh} />
      )}
      {deleting && (
        <AdminPopup
          title={deleting.contest ? t('contest', 'delContestTitle') : fmt(t('contest', 'delEventTitle'), { title: deleting.event.title })}
          onDismiss={() => setDeleting(null)}
          actions={[
            { label: t('contest', 'delete'), onClick: remove, kind: 'danger' },
            { label: t('contest', 'cancel'), onClick: () => setDeleting(null), kind: 'ghost' },
          ]}
        >
          {deleting.contest ? fmt(t('contest', 'delContestBody'), { n: deleting.contest.applied }) : t('contest', 'delEventBody')}
        </AdminPopup>
      )}
    </section>
  );
};

export default AdminStoreEvents;
