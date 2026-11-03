import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { joinParty, storeErrorCode } from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';
import { CURRENT_PARTY_KEY, useCurrentParty } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { ConfirmDialog } from '../components/store/StorePopup';
import { fmt } from '../components/store/fmt';
import { card, meBadge, primaryButton, recorderBadge } from '../components/store/storeStyles';
import { useGoBack } from '../hooks/useGoBack';

/**
 * 코드로 그룹 합류 (시안 3c). 코드 입력 → 합류 완료(그룹 목록) → "그룹 화면으로" 3b.
 * 실패: 코드 틀림 / 게임 중이라 못 옮김. 이미 다른 그룹이면 "옮길까요?" 확인
 */
const StorePartyJoin = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const { data: current } = useCurrentParty();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [askMove, setAskMove] = useState(false);
  const [joined, setJoined] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (move = false) => {
    setBusy(true);
    setError(null);
    try {
      const party = await joinParty(storeId, code, move);
      setAskMove(false);
      setJoined(party);
      queryClient.setQueryData(CURRENT_PARTY_KEY, party);
    } catch (e) {
      const c = storeErrorCode(e);
      if (c === 'ALREADY_IN_PARTY') setAskMove(true);
      else if (c === 'PARTY_PLAYING') setError('playing');
      else if (c === 'PARTY_NOT_FOUND') setError('wrong');
      else if (c === 'NOT_CHECKED_IN') setError('checkin');
      else setError('failed');
      if (c !== 'ALREADY_IN_PARTY') setAskMove(false);
    } finally {
      setBusy(false);
    }
  };

  const errText = {
    wrong: [t('store', 'codeWrongTitle'), t('store', 'codeWrongDesc')],
    playing: [t('store', 'codePlayingTitle'), t('store', 'codePlayingDesc')],
    checkin: [t('store', 'blockNotCheckedIn'), ''],
    failed: [t('store', 'actionFailed'), ''],
  }[error];
  const recorderName = joined?.members.find(m => m.recorder)?.nickname;
  const currentRecorder = current?.members.find(m => m.recorder)?.nickname;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'codeJoinTitle')} onBack={() => goBack(`/store/${storeId}`)} backLabel={t('common', 'back')} />
      {!joined ? (
        <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '40px 24px 140px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'codeJoinHeading')}</h1>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', 'codeJoinDesc')}</p>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('store', 'codeLabel')}</span>
            <input
              inputMode="numeric" maxLength={4} placeholder="0000" value={code} autoFocus
              aria-invalid={!!error}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(null); }}
              style={{
                height: 72, boxSizing: 'border-box', borderRadius: '16px', textAlign: 'center',
                border: `2px solid ${error ? '#DC2626' : V('--th-border')}`, backgroundColor: V('--th-card'),
                fontSize: '36px', fontWeight: 700, letterSpacing: '0.4em', color: V('--th-text'), outline: 'none',
              }}
            />
          </label>
          {errText && (
            <section role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#991B1B' }}>{errText[0]}</span>
              {errText[1] && <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7F1D1D' }}>{errText[1]}</span>}
            </section>
          )}
        </main>
      ) : (
        <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '40px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <span style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: '#DCFCE7', color: '#2F6B4C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
            </span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{fmt(t('store', 'joinedTitle'), { name: recorderName })}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'joinedDesc')}</p>
          </div>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'partyTitle')}</h2>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'peopleCount'), { n: joined.members.length })}</span>
            </div>
            <div style={{ ...card, padding: '4px 16px' }}>
              {joined.members.map((m, i) => (
                <div key={m.memberId} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, backgroundColor: m.memberId === myId ? `rgba(${V('--th-primary-rgb')}, 0.3)` : V('--th-bg-deep') }} />
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                    {m.nickname}
                    {m.recorder && <span style={recorderBadge}>{t('store', 'recorderBadge')}</span>}
                    {m.memberId === myId && <span style={meBadge}>{t('store', 'meBadge')}</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
      <StoreFixedBottom>
        {!joined ? (
          <button onClick={() => submit(false)} disabled={code.length !== 4 || busy} style={{ ...primaryButton(code.length === 4 && !busy), height: 52, fontSize: '16px' }}>
            {t('store', 'joinButton')}
          </button>
        ) : (
          <button onClick={() => navigate(`/store/${storeId}/party`, { replace: true })} style={{ ...primaryButton(), height: 52, fontSize: '16px' }}>
            {t('store', 'goPartyScreen')}
          </button>
        )}
      </StoreFixedBottom>
      {askMove && (
        <ConfirmDialog
          title={t('store', 'moveTitle')}
          body={fmt(t('store', 'moveDesc'), { name: currentRecorder })}
          cancelLabel={t('store', 'cancel')}
          actionLabel={t('store', 'moveAction')}
          danger={false}
          busy={busy}
          onCancel={() => setAskMove(false)}
          onAction={() => submit(true)}
        />
      )}
    </div>
  );
};

export default StorePartyJoin;
