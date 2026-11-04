import { useLanguage } from '../../i18n/LanguageContext';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import AdminSubPage from './AdminSubPage';
import AdminPager from './AdminPager';
import usePaged from '../../hooks/usePaged';

const rowButton = {
  height: 56, display: 'flex', alignItems: 'center', gap: '12px', padding: 0, border: 'none', background: 'none',
  cursor: 'pointer', textAlign: 'left', width: '100%',
};
const mmdd = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 신고 한 줄 (게임 · 그 경기 1등 묶음). 6 매장 탭과 6n 신고 전체가 같이 쓴다 */
export const ReportRow = ({ group: g, first, onOpen, t }) => (
  <button onClick={() => onOpen(g)} style={{ ...rowButton, borderTop: first ? 'none' : `1px solid ${V('--th-border')}` }}>
    <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{g.targetNickname ?? t('store', 'leftMember')} · {g.gameName}</span>
      <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
        {fmt(t('admin', g.count > 1 ? 'reportsLineMany' : 'reportsLineOne'), { n: g.count, last: mmdd(g.lastAt) })}
        {g.status !== 'OPEN' ? ` · ${t('admin', `reportStatus${g.status}`)}` : ''}
      </span>
    </span>
    <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-primary') }}>{t('admin', 'reportCheck')}</span>
  </button>
);

const PER_PAGE = 10;

/** 6n 신고 전체: 처리 전 먼저, 그 안에서 최근 순 (서버 정렬 그대로). 10개씩 쪽 번호 */
const AdminReportsAll = ({ store, reports, onOpen, onBack }) => {
  const { t } = useLanguage();
  const open = reports.filter(r => r.status === 'OPEN').length;
  const paged = usePaged(reports, PER_PAGE);
  return (
    <AdminSubPage title={t('admin', 'reportsAllTitle')} info={t('admin', 'reportsAllInfo')} onBack={onBack} t={t}>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
        {fmt(t('admin', 'reportsAllCount'), { store: storeTitle(store), open, n: reports.length })}
      </span>
      <section style={{ backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 18px' }}>
        {reports.length === 0 && <div style={{ padding: '16px 0', fontSize: '14px', color: V('--th-text-sub') }}>{t('admin', 'reportsEmpty')}</div>}
        {paged.items.map((g, i) => <ReportRow key={`${g.boardGameId}-${g.targetMemberId}`} group={g} first={i === 0} onOpen={onOpen} t={t} />)}
      </section>
      <AdminPager {...paged} label={t('admin', 'pagesAria')} t={t} />
    </AdminSubPage>
  );
};

export default AdminReportsAll;
