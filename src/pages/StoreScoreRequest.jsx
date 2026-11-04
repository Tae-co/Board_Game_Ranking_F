import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScoreRequests, requestScoreSheet, uploadScoreRequestImage, voteScoreRequest } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import { InfoButton, InfoPopup } from '../components/store/StorePopup';
import { CameraIcon, CheckIcon, ThumbIcon } from '../components/store/StoreIcons';
import { card, sectionTitle } from '../components/store/storeStyles';
import { REQUEST_PILL } from '../components/store/requestStatus';
import { useGoBack } from '../hooks/useGoBack';

const KEY = ['store', 'scoreRequests'];

const labelStyle = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 700, color: V('--th-text') };
const fieldStyle = {
  boxSizing: 'border-box', borderRadius: '12px', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'),
  color: V('--th-text'), fontWeight: 400, fontFamily: 'inherit',
};

/** 10/27 */
const md = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/**
 * 점수판 요청 (시안 2g) `/store/:storeId/score-request`. 매장 멤버·구경 모두. 게임 이름·계산 방법·사진으로 요청하고,
 * 요청 많은 게임엔 공감, 내 요청은 상태(확인 중 → 만드는 중 → 추가됨)만 본다. 알림 없음.
 */
const StoreScoreRequest = () => {
  const { storeId } = useParams();
  const goBack = useGoBack();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [howTo, setHowTo] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(false);
  const fileRef = useRef(null);

  const { data } = useQuery({ queryKey: KEY, queryFn: getScoreRequests });

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      setImageUrl(await uploadScoreRequestImage(file));
    } catch {
      setError(t('store', 'photoUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!name.trim()) {
      setError(t('store', 'requestNameRequired'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      queryClient.setQueryData(KEY, await requestScoreSheet({ name: name.trim(), howToScore: howTo, imageUrl, storeId: Number(storeId) }));
      setSent(true);
      setName('');
      setHowTo('');
      setImageUrl(null);
    } catch {
      setError(t('store', 'actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const vote = async (id) => {
    try {
      queryClient.setQueryData(KEY, await voteScoreRequest(id, Number(storeId)));
    } catch {
      queryClient.invalidateQueries({ queryKey: KEY });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar
        title={t('store', 'scoreRequestTitle')}
        onBack={() => goBack(`/store/${storeId}`)}
        backLabel={t('common', 'back')}
        right={<InfoButton onClick={() => setInfo(true)} label={t('store', 'infoAria')} />}
      />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {sent ? (
          <section style={{ ...card, padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <span style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: '#E7F6EC', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon />
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'requestSent')}</span>
            <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'requestSentDesc')}</span>
            <button onClick={() => setSent(false)} style={{
              marginTop: 6, height: 44, padding: '0 18px', borderRadius: '12px', cursor: 'pointer',
              border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '14px', fontWeight: 700,
            }}>{t('store', 'requestAnother')}</button>
          </section>
        ) : (
          <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'requestHeading')}</h1>
            <label style={labelStyle}>
              {t('store', 'requestName')}
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t('store', 'requestNamePlaceholder')}
                style={{ ...fieldStyle, height: 48, padding: '0 14px', fontSize: '15px' }} />
            </label>
            <label style={labelStyle}>
              {t('store', 'requestHowTo')}
              <textarea value={howTo} onChange={(e) => setHowTo(e.target.value)} maxLength={2000} placeholder={t('store', 'requestHowToPlaceholder')}
                style={{ ...fieldStyle, height: 88, padding: '12px', fontSize: '14px', resize: 'none' }} />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'requestPhoto')}</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                height: 88, borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', padding: 0,
                border: `1px dashed ${V('--th-border')}`, backgroundColor: V('--th-bg'), color: V('--th-text-sub'),
                fontSize: '13px', fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                {imageUrl
                  ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <><CameraIcon />{uploading ? t('common', 'loading') : t('store', 'requestPhotoAdd')}</>}
              </button>
            </div>
            {error && <span role="alert" style={{ fontSize: '13px', color: '#B91C1C' }}>{error}</span>}
            <button onClick={send} disabled={busy || uploading} style={{
              height: 52, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-primary'),
              color: '#fff', fontSize: '16px', fontWeight: 700, opacity: busy || uploading ? 0.6 : 1,
            }}>{t('store', 'requestSend')}</button>
          </section>
        )}

        {data?.popular.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={sectionTitle}>{t('store', 'requestPopular')}</h2>
            <div style={{ ...card, padding: '4px 16px' }}>
              {data.popular.map((g, i) => (
                <div key={g.id} style={{ height: 60, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
                  <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{g.name}</span>
                  <button onClick={() => vote(g.id)} aria-pressed={g.voted} aria-label={`${t('store', 'requestVote')} ${g.count}`} style={{
                    height: 36, minWidth: 64, padding: '0 12px', borderRadius: 999, cursor: 'pointer',
                    border: `1px solid ${g.voted ? V('--th-primary') : V('--th-border')}`,
                    backgroundColor: g.voted ? `rgba(${V('--th-primary-rgb')}, 0.12)` : V('--th-card'),
                    color: g.voted ? V('--th-primary') : V('--th-text'), fontSize: '14px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}><ThumbIcon filled={g.voted} />{g.count}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {data?.mine.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={sectionTitle}>{t('store', 'requestMine')}</h2>
            <div style={{ ...card, padding: '4px 16px' }}>
              {data.mine.map((r, i) => {
                const [bg, color, key] = REQUEST_PILL[r.status];
                return (
                  <div key={r.id} style={{ height: 60, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{r.name}</span>
                      <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                        {md(r.createdAt)} {t('store', 'requestedSuffix')}{r.status === 'ADDED' ? ` · ${t('store', 'requestAddedNote')}` : ''}
                      </span>
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: 999, backgroundColor: bg, color }}>{t('store', key)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      {info && <InfoPopup title={t('store', 'infoTitle')} text={t('store', 'requestInfo')} okLabel={t('store', 'infoOk')} onClose={() => setInfo(false)} />}
    </div>
  );
};

export default StoreScoreRequest;
