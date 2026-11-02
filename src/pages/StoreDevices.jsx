import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoreDevices, getStoreHome, registerStoreDevice, revokeStoreDevice, storeErrorCode } from '../api/services/stores';
import { storeTitle } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import { fmt } from '../components/store/fmt';
import { card, sectionTitle } from '../components/store/storeStyles';
import { deviceSeen } from '../components/store/deviceSeen';
import { ConfirmDialog } from '../components/store/StorePopup';

const KINDS = ['TV', 'TABLE'];

const inputStyle = {
  boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', backgroundColor: V('--th-card'),
  color: V('--th-text'), width: '100%',
};

/** 다음 기기 이름: 이 종류의 지금 대수 + 1 (매장 TV 2 · 테이블 4) */
const nextName = (devices, kind, t) => {
  const n = devices.filter(d => d.kind === kind).length + 1;
  return fmt(t('store', kind === 'TV' ? 'deviceNameTv' : 'deviceNameTable'), { n });
};

/** 문구 안 {b} 자리를 굵은 글씨로 */
const withBold = (text, bold) => {
  const [before, after] = text.split('{b}');
  return <>{before}<b style={{ color: V('--th-text') }}>{bold}</b>{after}</>;
};

/**
 * 2l 매장 기기 추가 · 관리 (STAFF 폰). 기기(4j)에 뜬 6자리 + 종류 + 이름으로 등록, 아래 기기 목록 + 해제.
 * 이 매장 STAFF가 아니면 서버가 403 → 매장 홈으로.
 */
const StoreDevices = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState('TABLE');
  const [code, setCode] = useState('');
  const [name, setName] = useState(null); // null = 자동 이름
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { done: name } | { error: code }
  const [revoking, setRevoking] = useState(null);

  const { data: home } = useQuery({
    queryKey: ['store', Number(storeId), 'home'],
    queryFn: () => getStoreHome(storeId),
    staleTime: 1000 * 30,
  });
  const devicesKey = ['store', Number(storeId), 'devices'];
  const { data: devices = [] } = useQuery({
    queryKey: devicesKey,
    queryFn: () => getStoreDevices(storeId),
    // 등록 직후 기기가 토큰을 받아 가면 '기다리는 중' → '방금 연결됨'으로
    refetchInterval: 1000 * 10,
    retry: false,
  });

  const shownName = name ?? nextName(devices, kind, t);
  const digits = code.replace(/\D/g, '').slice(0, 6);

  const goHome = () => navigate(`/store/${storeId}`, { replace: true });

  const handleSubmit = async () => {
    if (digits.length !== 6 || !shownName.trim()) {
      setResult({ error: 'PAIR_CODE_INVALID' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const list = await registerStoreDevice(storeId, { code: digits, kind, name: shownName.trim() });
      queryClient.setQueryData(devicesKey, list);
      setResult({ done: shownName.trim() });
      setCode('');
      setName(null);
    } catch (e) {
      const err = storeErrorCode(e);
      if (err === 'NOT_STAFF_OF_STORE' || err === 'STORE_CLOSED') goHome();
      else setResult({ error: err });
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    const device = revoking;
    setRevoking(null);
    try {
      queryClient.setQueryData(devicesKey, await revokeStoreDevice(storeId, device.id));
    } catch {
      queryClient.invalidateQueries({ queryKey: devicesKey });
    }
  };

  const errorText = result?.error === 'DEVICE_LIMIT' ? t('store', 'deviceLimit')
    : result?.error === 'TOO_MANY_REQUESTS' ? t('store', 'tooManyTries')
    : result?.error ? t('store', 'deviceCodeError') : null;
  const codeError = result?.error === 'PAIR_CODE_INVALID';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'devicesTitle')} onBack={goHome} backLabel={t('common', 'back')} />

      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
          {fmt(t('store', 'devicesStaffLine'), { store: home ? storeTitle(home.store) : '' })}
        </span>

        <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'deviceAddTitle')}</h1>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
              {withBold(t('store', 'deviceAddDesc'), t('store', 'useAsDevice'))}
            </span>
          </div>

          <div role="radiogroup" aria-label={t('store', 'deviceKindAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            {KINDS.map(k => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  onClick={() => { setKind(k); setName(null); }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', padding: '12px', borderRadius: '14px', cursor: 'pointer',
                    border: `2px solid ${on ? V('--th-primary') : V('--th-border')}`,
                    backgroundColor: on ? `rgba(${V('--th-primary-rgb')}, 0.06)` : V('--th-card'), color: V('--th-text'),
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{t('store', k === 'TV' ? 'deviceKindTv' : 'deviceKindTable')}</span>
                  <span style={{ fontSize: '12px', lineHeight: 1.4, color: V('--th-text-sub') }}>{t('store', k === 'TV' ? 'deviceKindTvSub' : 'deviceKindTableSub')}</span>
                </button>
              );
            })}
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'deviceCodeLabel')}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits}
              onChange={(e) => { setCode(e.target.value); if (codeError) setResult(null); }}
              placeholder="000 000"
              style={{
                ...inputStyle, height: 56, border: `1px solid ${codeError ? '#DC2626' : V('--th-border')}`,
                fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: '24px', fontWeight: 700, letterSpacing: '0.12em',
              }}
            />
          </label>
          {errorText && <span role="alert" style={{ fontSize: '13px', lineHeight: 1.5, color: '#B91C1C' }}>{errorText}</span>}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>
              {t('store', 'deviceNameLabel')} <span style={{ fontWeight: 400, color: V('--th-text-sub') }}>{t('store', 'deviceNameHint')}</span>
            </span>
            <input
              type="text"
              maxLength={30}
              value={shownName}
              onChange={(e) => setName(e.target.value)}
              style={{ ...inputStyle, height: 48, border: `1px solid ${V('--th-border')}`, fontSize: '15px' }}
            />
          </label>

          {result?.done && (
            <div role="status" style={{ backgroundColor: '#E3F2E9', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', lineHeight: 1.5, color: '#1F5138' }}>
              {fmt(t('store', 'deviceDone'), { name: result.done })}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              height: 52, border: 'none', borderRadius: '14px', cursor: busy ? 'default' : 'pointer',
              backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700, opacity: busy ? 0.6 : 1,
            }}
          >
            {t('store', 'deviceRegister')}
          </button>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={sectionTitle}>
            {t('store', 'deviceListTitle')}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: V('--th-text-sub') }}>{fmt(t('store', 'deviceCount'), { n: devices.length })}</span>
          </h2>
          {devices.length > 0 && (
            <div style={{ ...card, padding: '4px 16px' }}>
              {devices.map((d, i) => {
                const seen = deviceSeen(d, t);
                return (
                  <div key={d.id} style={{ height: 60, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{d.name}</span>
                      <span style={{ fontSize: '12px', color: seen.stale ? '#B4500A' : V('--th-text-sub') }}>
                        {t('store', d.kind === 'TV' ? 'deviceKindTv' : 'deviceKindTable')} · {seen.text}
                      </span>
                    </span>
                    <button
                      onClick={() => setRevoking(d)}
                      style={{ height: 34, padding: '0 12px', borderRadius: 999, border: '1px solid #FECACA', backgroundColor: V('--th-card'), color: '#DC2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {t('store', 'deviceRevoke')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ backgroundColor: V('--th-bg-deep'), borderRadius: '14px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', lineHeight: 1.55, color: V('--th-text-sub') }}>
          <span>{withBold(t('store', 'deviceNoteAccount'), t('store', 'deviceNoteAccountBold'))}</span>
          <span>{t('store', 'deviceNoteLogout')}</span>
          <span>{t('store', 'deviceNoteExit')}</span>
          <span>{t('store', 'deviceNotePin')}</span>
        </section>
      </main>

      {revoking && (
        <ConfirmDialog
          title={fmt(t('store', 'deviceRevokeTitle'), { name: revoking.name })}
          body={t('store', 'deviceRevokeBody')}
          cancelLabel={t('common', 'cancel')}
          actionLabel={t('store', 'deviceRevoke')}
          onCancel={() => setRevoking(null)}
          onAction={handleRevoke}
        />
      )}
    </div>
  );
};

export default StoreDevices;
