import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getAuthUserId } from '../auth/storage';
import { useAutoEnterMatch, useCurrentParty } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { InfoButton, InfoPopup } from '../components/store/StorePopup';
import { fmt } from '../components/store/fmt';
import { hintText, meBadge, primaryButton, recorderBadge } from '../components/store/storeStyles';

/**
 * 오늘의 그룹 만들기 · 기다리는 화면 (시안 3b). 기록자는 "다 모였어요 · 게임 고르러 가기",
 * 합류한 사람은 회색 "[기록자]님이 게임을 고르는 중" — 기록자가 시작하면 점수판으로 바뀐다
 */
const StoreParty = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const [info, setInfo] = useState(false);
  const { data: party, isLoading } = useCurrentParty();
  useAutoEnterMatch(party, myId, navigate);

  const goHome = () => navigate(`/store/${storeId}`);
  if (!isLoading && !party) return <Navigate to={`/store/${storeId}`} replace />;
  const isRecorder = party?.recorderMemberId === myId;
  const recorder = party?.members.find(m => m.recorder);
  const minSlots = 4;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar
        title={t('store', isRecorder ? 'partyCreateTitle' : 'partyTitle')}
        onBack={goHome}
        backLabel={t('common', 'back')}
        right={<InfoButton onClick={() => setInfo(true)} label={t('store', 'infoAria')} />}
      />
      {party && (
        <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={{
            backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          }}>
            <span style={{ fontSize: '15px', color: V('--th-text') }}>{t('store', 'partyCodeTell')}</span>
            <span style={{ fontSize: '64px', fontWeight: 700, letterSpacing: '0.24em', lineHeight: 1.1, paddingLeft: '0.24em', color: V('--th-primary') }}>{party.code}</span>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub'), textAlign: 'center' }}>{t('store', 'partyCodePath')}</span>
          </section>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'joinedPeople')}</h2>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'peopleCount'), { n: party.members.length })}</span>
            </div>
            <div style={{ backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' }}>
              {party.members.map((m, i) => (
                <div key={m.memberId} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, backgroundColor: m.memberId === myId ? `rgba(${V('--th-primary-rgb')}, 0.3)` : V('--th-bg-deep') }} />
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                    {m.nickname}
                    {m.recorder && <span style={recorderBadge}>{t('store', 'recorderBadge')}</span>}
                    {m.memberId === myId && <span style={meBadge}>{t('store', 'meBadge')}</span>}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#2F6B4C' }}>{t('store', 'joinedState')}</span>
                </div>
              ))}
              {party.members.length < minSlots && (
                <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: `1px solid ${V('--th-border')}`, color: V('--th-text-sub') }}>
                  <span style={{ width: 32, height: 32, borderRadius: 999, border: `2px dashed ${V('--th-border')}`, boxSizing: 'border-box', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '15px' }}>{t('store', 'waitingSlot')}</span>
                </div>
              )}
            </div>
          </section>
        </main>
      )}
      {party && (
        <StoreFixedBottom>
          {isRecorder ? (
            <>
              <button onClick={goHome} style={{ ...primaryButton(), height: 52, fontSize: '16px' }}>{t('store', 'allHereGo')}</button>
              <span style={hintText}>{t('store', 'laterJoinHint')}</span>
            </>
          ) : (
            <>
              <button disabled style={{ ...primaryButton(false), height: 52, fontSize: '16px' }}>
                {fmt(t('store', 'recorderChoosing'), { name: recorder?.nickname })}
              </button>
              <span style={hintText}>{t('store', 'choosingSheetHint')}</span>
            </>
          )}
        </StoreFixedBottom>
      )}
      {info && <InfoPopup title={t('store', 'infoTitle')} text={t('store', 'partyInfo')} okLabel={t('store', 'infoOk')} onClose={() => setInfo(false)} />}
    </div>
  );
};

export default StoreParty;
