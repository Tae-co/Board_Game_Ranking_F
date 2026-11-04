import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreMonthlyReport, storeErrorCode } from '../api/services/stores';
import { storeTitle } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import { HeatGrid, PopularBars, ReportTiles } from '../components/store/ReportStats';
import { fmt } from '../components/store/fmt';
import { shortDate } from '../components/contest/contestUtils';
import { card, sectionTitle } from '../components/store/storeStyles';
import { Skeleton } from '../components/Skeleton';

/** "2026-10" ± n달 */
const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthButton = {
  width: 44, height: 44, borderRadius: '12px', cursor: 'pointer', border: `1px solid ${V('--th-border')}`,
  backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '18px',
};

/**
 * 월간 리포트 (시안 8, STAFF) `/store/:storeId/report`. 경기·방문·새 멤버·재방문율(지난달 대비), 인기 게임,
 * 요일×시간 붐비는 시간, 단골 TOP 3. 이 매장 STAFF가 아니면 서버가 403 → 매장 홈으로.
 * 이번 달 이벤트 결과는 하루 대회(5단계)가 생기면 더한다.
 */
/** 이번 달 이벤트 결과 한 줄 (시안 8): 대회는 참가 인원·우승, 매장 이벤트는 기간 */
const eventLine = (e, t) => {
  if (e.kind === 'EVENT') {
    const [from, to] = e.date.split('~');
    return fmt(t('contest', 'reportEventLine'), { period: `${shortDate(from)} ~ ${shortDate(to)}` });
  }
  const date = shortDate(e.date);
  if (e.status === 'FINISHED') {
    return fmt(t('contest', 'reportContestLine'), { date, n: e.participants, winners: e.winners.join(', ') || '—' });
  }
  if (e.status === 'CANCELLED') return fmt(t('contest', 'reportContestCancelled'), { date });
  return fmt(t('contest', 'reportContestOther'), { date, status: t('contest', `status${e.status}`) });
};

const StoreReport = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [month, setMonth] = useState(null); // null = 이번 달 (서버가 정함)

  const { data: report, error } = useQuery({
    queryKey: ['store', Number(storeId), 'report', month],
    queryFn: () => getStoreMonthlyReport(storeId, month),
    retry: false,
  });
  const goHome = () => navigate(`/store/${storeId}`, { replace: true });

  useEffect(() => {
    const code = storeErrorCode(error);
    if (code === 'NOT_STAFF_OF_STORE' || code === 'STORE_NOT_FOUND') navigate(`/store/${storeId}`, { replace: true });
  }, [error, navigate, storeId]);
  const current = report?.month ?? month;
  const [y, m] = (current ?? '').split('-').map(Number);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'reportTitle8')} onBack={goHome} backLabel={t('common', 'back')} />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => current && setMonth(shiftMonth(current, -1))} aria-label={t('store', 'prevMonth')} style={monthButton}>‹</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: V('--th-text') }}>
              {current ? (lang === 'ko' ? `${y}년 ${m}월` : new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })) : ''}
            </span>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{report ? storeTitle(report.store) : ''}</span>
          </div>
          <button onClick={() => current && setMonth(shiftMonth(current, 1))} aria-label={t('store', 'nextMonth')} style={monthButton}>›</button>
        </div>

        {!report ? <Skeleton height={300} radius={20} /> : (
          <>
            <ReportTiles report={report} withDelta t={t} />
            {report.popular.length > 0 && (
              <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={sectionTitle}>{t('store', 'reportPopular')}</h2>
                <PopularBars popular={report.popular} />
              </section>
            )}
            <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h2 style={sectionTitle}>{t('store', 'reportBusy')}</h2>
                <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'reportBusyNote')}</span>
              </div>
              <HeatGrid report={report} t={t} />
            </section>
            {report.regulars.length > 0 && (
              <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h2 style={sectionTitle}>{t('store', 'reportRegulars')}</h2>
                  <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'reportRegularsNote')}</span>
                </div>
                {report.regulars.map((r, i) => (
                  <div key={r.nickname} style={{ height: 44, display: 'flex', alignItems: 'center', gap: '10px', borderTop: `1px solid ${V('--th-border')}` }}>
                    <span style={{ width: 20, fontWeight: 700, color: V('--th-primary') }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '15px', color: V('--th-text') }}>{r.nickname}</span>
                    <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'reportRegularValue'), { d: r.days, g: r.games })}</span>
                  </div>
                ))}
              </section>
            )}
            <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ ...sectionTitle, marginBottom: 8 }}>{t('contest', 'reportEvents')}</h2>
              {(report.events ?? []).length === 0 && <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('contest', 'reportNoEvents')}</span>}
              {(report.events ?? []).map((e, i) => (
                <div key={`${e.kind}-${e.title}-${i}`} style={{ minHeight: 52, padding: '8px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', borderTop: `1px solid ${V('--th-border')}` }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{e.title}</span>
                  <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{eventLine(e, t)}</span>
                </div>
              ))}
            </section>
            <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{t('store', 'reportPrivacy')}</span>
          </>
        )}
      </main>
    </div>
  );
};

export default StoreReport;
