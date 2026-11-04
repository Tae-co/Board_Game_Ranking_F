import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  createAdminStoreContest, createAdminStoreEvent, deleteAdminStoreContest, getAdminStoreRooms, updateAdminStoreContest,
  updateAdminStoreEvent, uploadAdminImage,
} from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import AdminSubPage, { AdminPopup } from './AdminSubPage';
import { CameraIcon } from '../store/StoreIcons';
import { fmt } from '../store/fmt';

const sectionStyle = {
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
  padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px',
};
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 700, color: V('--th-text'), minWidth: 0, flex: 1 };
const inputStyle = {
  height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', width: '100%',
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), outline: 'none',
  fontSize: '15px', fontWeight: 400, color: V('--th-text'),
};
const tab = (on) => ({
  flex: 1, height: 40, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
  backgroundColor: on ? V('--th-primary') : 'transparent', color: on ? '#fff' : V('--th-text-sub'),
});

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * 6j 이벤트 등록 · 수정 (전체 화면). 게임 대회(하루 대회) / 매장 이벤트(게임방·랭킹 없음).
 * 대회 수정은 신청을 그대로 두고 덮어쓴다 (35차). 대회 삭제는 신청도 같이 사라진다.
 * contest/event = 수정할 항목 (없으면 새로 등록)
 */
const AdminEventForm = ({ store, contest, event, defaultKind = 'contest', onBack, onSaved }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const editing = !!(contest || event);
  const [kind, setKind] = useState(event ? 'event' : contest ? 'contest' : defaultKind);
  const [c, setC] = useState(() => ({
    title: contest?.title ?? '', boardGameId: contest?.boardGameId ?? '', date: contest?.date ?? today(),
    time: contest?.time ?? '13:00', capacity: contest?.capacity ?? '', rounds: contest?.rounds ?? 3, prizeText: contest?.prizeText ?? '',
  }));
  const [e, setE] = useState(() => ({
    title: event?.title ?? '', benefitText: event?.benefitText ?? '', howToUse: event?.howToUse ?? '', imageUrl: event?.imageUrl ?? '', oneTime: event?.oneTime ?? false,
    startsOn: event?.startsOn ?? today(), endsOn: event?.endsOn ?? today(),
  }));
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['adminStoreRooms', store.id],
    queryFn: () => getAdminStoreRooms(store.id),
  });
  const game = rooms.find(r => r.boardGameId === Number(c.boardGameId));

  const setCField = (key) => (ev) => setC(p => ({ ...p, [key]: ev.target.value }));
  const setEField = (key) => (ev) => setE(p => ({ ...p, [key]: ev.target.value }));
  const pickGame = (ev) => {
    const g = rooms.find(r => r.boardGameId === Number(ev.target.value));
    setC(p => ({ ...p, boardGameId: ev.target.value, capacity: g ? g.maxPlayers : p.capacity }));
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      if (kind === 'contest') {
        const form = {
          title: c.title, boardGameId: Number(c.boardGameId), date: c.date, time: c.time,
          capacity: Number(c.capacity), rounds: Number(c.rounds), prizeText: c.prizeText,
        };
        const list = contest
          ? await updateAdminStoreContest(store.id, contest.id, form)
          : await createAdminStoreContest(store.id, form);
        const item = contest ? list.find(x => x.id === contest.id) : list.reduce((a, b) => (a.id > b.id ? a : b));
        setSaved({ kind: 'contest', id: item?.id });
      } else {
        let imageUrl = e.imageUrl;
        if (imageFile) imageUrl = await uploadAdminImage(imageFile);
        const form = { ...e, imageUrl };
        if (event) await updateAdminStoreEvent(store.id, event.id, form);
        else await createAdminStoreEvent(store.id, form);
        setSaved({ kind: 'event' });
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message ?? t('contest', 'saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await deleteAdminStoreContest(store.id, contest.id);
    onSaved();
    onBack();
  };

  const title = !editing ? t('contest', 'newTitle') : t('contest', contest ? 'editContestTitle' : 'editEventTitle');
  const photo = preview || e.imageUrl;

  return (
    <AdminSubPage title={title} info={t('contest', 'infoBody')} onBack={onBack} t={t}>
      {contest && (
        <section style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#9A3412' }}>{fmt(t('contest', 'editNotice'), { n: contest.applied, title: contest.title })}</span>
          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7C2D12' }}>{t('contest', 'editNoticeBody')}</span>
        </section>
      )}

      {!editing && (
        <div role="tablist" aria-label={title} style={{ display: 'flex', gap: '4px', padding: 4, borderRadius: '14px', backgroundColor: V('--th-bg-deep') }}>
          <button role="tab" aria-selected={kind === 'contest'} onClick={() => setKind('contest')} style={tab(kind === 'contest')}>{t('contest', 'kindContest')}</button>
          <button role="tab" aria-selected={kind === 'event'} onClick={() => setKind('event')} style={tab(kind === 'event')}>{t('contest', 'kindEvent')}</button>
        </div>
      )}

      {kind === 'contest' ? (
        <section style={sectionStyle}>
          <label style={labelStyle}>{t('contest', 'fContestName')}
            <input style={inputStyle} placeholder={t('contest', 'fContestNamePh')} value={c.title} onChange={setCField('title')} maxLength={40} />
          </label>
          <label style={labelStyle}>{t('contest', 'fGame')}
            <select style={inputStyle} value={c.boardGameId} onChange={pickGame}>
              <option value="" disabled>—</option>
              {rooms.map(r => (
                <option key={r.boardGameId} value={r.boardGameId}>
                  {fmt(t('contest', 'fGameOption'), { game: r.name, min: r.minPlayers, max: r.maxPlayers })}{r.closed ? t('contest', 'fGameClosed') : ''}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={labelStyle}>{t('contest', 'fDate')}<input type="date" style={inputStyle} value={c.date} onChange={setCField('date')} /></label>
            <label style={labelStyle}>{t('contest', 'fTime')}<input type="time" style={inputStyle} value={c.time} onChange={setCField('time')} /></label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={labelStyle}>{t('contest', 'fCapacity')}
              <input type="number" inputMode="numeric" style={inputStyle} min={game?.minPlayers} max={game?.maxPlayers} value={c.capacity} onChange={setCField('capacity')} />
            </label>
            <label style={labelStyle}>{t('contest', 'fRounds')}
              <input type="number" inputMode="numeric" style={inputStyle} min={1} max={10} value={c.rounds} onChange={setCField('rounds')} />
            </label>
          </div>
          <label style={labelStyle}>{t('contest', 'fPrize')}
            <input style={inputStyle} placeholder={t('contest', 'fPrizePh')} value={c.prizeText} onChange={setCField('prizeText')} maxLength={80} />
          </label>
        </section>
      ) : (
        <section style={sectionStyle}>
          <label style={labelStyle}>{t('contest', 'fEventName')}
            <input style={inputStyle} placeholder={t('contest', 'fEventNamePh')} value={e.title} onChange={setEField('title')} maxLength={40} />
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={labelStyle}>{t('contest', 'fStart')}<input type="date" style={inputStyle} value={e.startsOn} onChange={setEField('startsOn')} /></label>
            <label style={labelStyle}>{t('contest', 'fEnd')}<input type="date" style={inputStyle} value={e.endsOn} onChange={setEField('endsOn')} /></label>
          </div>
          <label style={labelStyle}>{t('contest', 'fBody')}
            <textarea
              style={{ ...inputStyle, height: 104, padding: '12px 14px', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
              placeholder={t('contest', 'fBodyPh')} value={e.benefitText} onChange={setEField('benefitText')} maxLength={300}
            />
          </label>
          <label style={labelStyle}>{t('contest', 'fHowToUse')}
            <textarea
              style={{ ...inputStyle, height: 104, padding: '12px 14px', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
              placeholder={t('contest', 'fHowToUsePh')} value={e.howToUse} onChange={setEField('howToUse')} maxLength={500}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('contest', 'fOneTime')}</span>
              <span style={{ fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('contest', 'fOneTimeSub')}</span>
            </span>
            <button
              role="switch"
              aria-checked={e.oneTime}
              aria-label={t('contest', 'fOneTime')}
              onClick={() => setE(p => ({ ...p, oneTime: !p.oneTime }))}
              style={{
                width: 52, height: 32, flexShrink: 0, padding: 3, border: 'none', borderRadius: 999, cursor: 'pointer',
                backgroundColor: e.oneTime ? V('--th-primary') : '#D1D5DB',
                display: 'flex', justifyContent: e.oneTime ? 'flex-end' : 'flex-start',
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(17,24,39,0.2)' }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('contest', 'fPhoto')}</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {photo && <img src={photo} alt="" style={{ width: 88, height: 88, borderRadius: '12px', objectFit: 'cover' }} />}
              <label style={{
                width: 88, height: 88, boxSizing: 'border-box', borderRadius: '12px', cursor: 'pointer', border: '1px dashed #D1D5DB',
                backgroundColor: V('--th-bg'), color: V('--th-text-sub'), fontSize: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}>
                <CameraIcon size={20} />
                {t('contest', photo ? 'fPhotoChange' : 'fPhotoAdd')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (!f) return;
                  setImageFile(f);
                  setPreview(URL.createObjectURL(f));
                }} />
              </label>
            </div>
          </div>
        </section>
      )}

      {error && <p style={{ margin: 0, fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>{error}</p>}
      <button onClick={submit} disabled={saving} style={{
        height: 52, border: 'none', borderRadius: '14px', cursor: saving ? 'not-allowed' : 'pointer',
        backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700, opacity: saving ? 0.6 : 1,
      }}>{t('contest', editing ? 'save' : 'register')}</button>
      {contest && (
        <button onClick={() => setDeleting(true)} style={{
          height: 48, borderRadius: '14px', cursor: 'pointer', border: '1px solid #FECACA',
          backgroundColor: V('--th-card'), color: '#DC2626', fontSize: '15px', fontWeight: 700,
        }}>{t('contest', 'deleteContest')}</button>
      )}

      {saved?.kind === 'contest' && (
        <AdminPopup
          title={t('contest', contest ? 'savedContestEdit' : 'savedContestNew')}
          onDismiss={onBack}
          actions={[
            ...(saved.id ? [{ label: t('contest', 'seeContest'), onClick: () => navigate(`/store/${store.id}/contest/${saved.id}`) }] : []),
            { label: t('contest', 'toAdmin'), onClick: onBack, kind: 'ghost' },
          ]}
        >
          {contest ? fmt(t('contest', 'savedContestEditBody'), { n: contest.applied }) : t('contest', 'savedContestNewBody')}
        </AdminPopup>
      )}
      {saved?.kind === 'event' && (
        <AdminPopup
          title={t('contest', event ? 'savedEventEdit' : 'savedEventNew')}
          onDismiss={onBack}
          actions={[
            { label: t('contest', 'seeStore'), onClick: () => navigate(`/store/${store.id}`) },
            { label: t('contest', 'toAdmin'), onClick: onBack, kind: 'ghost' },
          ]}
        >
          {t('contest', 'savedEventBody')}
        </AdminPopup>
      )}
      {deleting && (
        <AdminPopup
          title={t('contest', 'delContestTitle')}
          onDismiss={() => setDeleting(false)}
          actions={[
            { label: t('contest', 'delete'), onClick: remove, kind: 'danger' },
            { label: t('contest', 'cancel'), onClick: () => setDeleting(false), kind: 'ghost' },
          ]}
        >
          {fmt(t('contest', 'delContestBody'), { n: contest.applied })}
        </AdminPopup>
      )}
    </AdminSubPage>
  );
};

export default AdminEventForm;
