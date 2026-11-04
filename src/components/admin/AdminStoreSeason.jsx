import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminStoreSeason, saveAdminStoreSeason } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import AdminSubPage from './AdminSubPage';

const CYCLES = [['MONTHLY', 'cycleMonthly'], ['QUARTERLY', 'cycleQuarterly'], ['CUSTOM', 'cycleCustom']];

const inputStyle = (auto) => ({
  height: 48, width: '100%', boxSizing: 'border-box', borderRadius: '12px', border: `1px solid ${V('--th-border')}`,
  backgroundColor: auto ? V('--th-bg') : V('--th-card'), padding: '0 12px', fontSize: '15px', color: V('--th-text'),
});

const card = {
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
  padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
};
const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const ghostButton = {
  height: 36, padding: '0 16px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0, fontSize: '13px', fontWeight: 500,
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'),
};
const LeftPill = ({ data, t }) => (
  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: '#E7F6EC', color: '#15803D' }}>
    {fmt(t('admin', 'seasonOngoingLeft'), { n: data.current.daysLeft })}
  </span>
);

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
    <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{label}</span>
    {children}
  </label>
);

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addMonths = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + n);
  return addDays(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, -1);
};

/** 다음 시즌 기본 이름 (서버 StoreSeasonService.defaultName과 같은 규칙) */
const defaultName = (cycle, start, t) => {
  const [y, m] = start.split('-').map(Number);
  return cycle === 'QUARTERLY'
    ? fmt(t('admin', 'seasonNameQuarter'), { y, q: Math.floor((m - 1) / 3) + 1 })
    : fmt(t('admin', 'seasonNameMonth'), { m });
};

const SeasonForm = ({ store, data, t }) => {
  const queryClient = useQueryClient();
  const [cur, setCur] = useState({ name: data.current.name, start: data.current.startDate, end: data.current.endDate });
  const [cycle, setCycle] = useState(data.cycle);
  const [nextName, setNextName] = useState(data.next?.name ?? '');
  const [nextNameEdited, setNextNameEdited] = useState(false);
  const [customEnd, setCustomEnd] = useState(data.next?.endDate ?? '');
  const [state, setState] = useState(null); // null | 'saving' | 'saved' | 'error'

  const nextStart = addDays(cur.end, 1);
  const auto = cycle !== 'CUSTOM';
  const nextEnd = auto ? addMonths(nextStart, cycle === 'QUARTERLY' ? 3 : 1) : customEnd;
  const shownNextName = nextNameEdited ? nextName : defaultName(cycle === 'CUSTOM' ? 'MONTHLY' : cycle, nextStart, t);

  const save = async () => {
    setState('saving');
    try {
      const res = await saveAdminStoreSeason(store.id, {
        currentName: cur.name, currentStart: cur.start, currentEnd: cur.end,
        cycle, nextName: shownNextName, nextEnd,
      });
      queryClient.setQueryData(['adminStoreSeason', store.id], res);
      setState('saved');
    } catch {
      setState('error');
    }
  };
  const touched = (fn) => (e) => { fn(e.target.value); setState(null); };

  return (
    <>
      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={h2Style}>{t('admin', 'seasonCurrent')}</h2>
          <LeftPill data={data} t={t} />
        </div>
        <Field label={t('admin', 'seasonName')}>
          <input value={cur.name} maxLength={40} onChange={touched(v => setCur({ ...cur, name: v }))} style={inputStyle(false)} />
        </Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label={t('admin', 'seasonStart')}>
            <input type="date" value={cur.start} max={data.today} onChange={touched(v => setCur({ ...cur, start: v }))} style={inputStyle(false)} />
          </Field>
          <Field label={t('admin', 'seasonEnd')}>
            <input type="date" value={cur.end} min={data.today} onChange={touched(v => setCur({ ...cur, end: v }))} style={inputStyle(false)} />
          </Field>
        </div>
      </section>
      <section style={card}>
        <h2 style={h2Style}>{t('admin', 'seasonNext')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('admin', 'seasonCycle')}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            {CYCLES.map(([key, label]) => {
              const on = cycle === key;
              return (
                <button key={key} onClick={() => { setCycle(key); setState(null); }} aria-pressed={on} style={{
                  height: 40, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                  border: `1px solid ${on ? V('--th-primary') : V('--th-border')}`,
                  backgroundColor: on ? V('--th-primary') : V('--th-card'), color: on ? '#fff' : V('--th-text-sub'),
                }}>{t('admin', label)}</button>
              );
            })}
          </div>
        </div>
        <Field label={t('admin', 'seasonName')}>
          <input value={shownNextName} maxLength={40} onChange={(e) => { setNextName(e.target.value); setNextNameEdited(true); setState(null); }} style={inputStyle(false)} />
        </Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label={t('admin', 'seasonStart')}>
            <input type="date" value={nextStart} readOnly style={inputStyle(true)} />
          </Field>
          <Field label={t('admin', 'seasonEnd')}>
            <input type="date" value={nextEnd} readOnly={auto} min={nextStart} onChange={touched(setCustomEnd)} style={inputStyle(auto)} />
          </Field>
        </div>
      </section>
      {state === 'error' && <span role="alert" style={{ fontSize: '13px', color: '#B91C1C' }}>{t('admin', 'seasonInvalid')}</span>}
      <button onClick={save} disabled={state === 'saving'} style={{
        height: 48, border: 'none', borderRadius: '12px', cursor: 'pointer', backgroundColor: V('--th-primary'),
        color: '#fff', fontSize: '15px', fontWeight: 700, opacity: state === 'saving' ? 0.6 : 1,
      }}>{t('admin', state === 'saved' ? 'seasonSaved' : 'seasonSave')}</button>
    </>
  );
};

const CYCLE_LABEL = Object.fromEntries(CYCLES);

/**
 * 6 어드민 매장 탭 · 시즌 요약: 이번 시즌 이름·기간, 다음 시즌 방식·시작일. 바꾸기는 관리하기 → 6l
 */
const AdminStoreSeason = ({ store, onManage }) => {
  const { t } = useLanguage();
  const { data } = useQuery({ queryKey: ['adminStoreSeason', store.id], queryFn: () => getAdminStoreSeason(store.id) });
  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <h2 style={h2Style}>{t('admin', 'season')}</h2>
          {data && <LeftPill data={data} t={t} />}
        </div>
        <button onClick={onManage} style={ghostButton}>{t('admin', 'manage')}</button>
      </div>
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
            {fmt(t('admin', 'seasonPeriod'), { name: data.current.name, from: data.current.startDate.slice(5), to: data.current.endDate.slice(5) })}
          </span>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {fmt(t('admin', 'seasonNextLine'), { cycle: t('admin', CYCLE_LABEL[data.cycle]), start: addDays(data.current.endDate, 1).slice(5) })}
          </span>
        </div>
      )}
    </section>
  );
};

/**
 * 6l 시즌 관리: 이번 시즌 이름·시작일·종료일은 바로 수정(시작일을 바꾸면 서버가 다시 계산),
 * 다음 시즌은 매월·분기(날짜 자동) / 직접 지정. 다음 시즌 시작일은 늘 이번 시즌 종료 다음 날.
 */
export const AdminSeasonManage = ({ store, onBack }) => {
  const { t } = useLanguage();
  const { data } = useQuery({ queryKey: ['adminStoreSeason', store.id], queryFn: () => getAdminStoreSeason(store.id) });
  return (
    <AdminSubPage title={t('admin', 'seasonManage')} info={t('admin', 'seasonInfo')} onBack={onBack} t={t}>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{storeTitle(store)}</span>
      {data && <SeasonForm key={`${data.current.id}-${data.current.startDate}-${data.current.endDate}`} store={store} data={data} t={t} />}
    </AdminSubPage>
  );
};

export default AdminStoreSeason;
