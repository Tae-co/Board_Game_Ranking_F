import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { GATE, GATE_ACTION } from '../../constants/gates';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

/**
 * 페이크 도어 페이월. 실제 결제는 없고 "관심 등록"까지만 받는다.
 *
 * 운영 축 항목과 랭킹 축 항목을 섞어서 한 리스트로 보여준다. 어느 쪽을 보고
 * 눌렀는지가 "랭킹이 유료 상품인가"에 대한 답이다 — plan-monetization.md 전제 3.
 * 항목 순서를 축끼리 묶지 않는 게 핵심이라 아래 배열 순서를 바꾸지 말 것.
 */
const FEATURES = [
  { key: 'seasonRanking', gate: null },
  { key: 'unlimitedMembers', gate: GATE.MEMBER_LIMIT },
  { key: 'unlimitedSheets', gate: GATE.CUSTOM_SHEET_LIMIT },
  { key: 'attendance', gate: null },
  { key: 'recapShare', gate: GATE.SEASON_RECAP_SHARE },
  { key: 'dues', gate: null },
  { key: 'exportRecords', gate: GATE.RECORD_EXPORT },
  { key: 'coAdmin', gate: GATE.CO_ADMIN },
  { key: 'multipleCommunities', gate: GATE.SECOND_COMMUNITY },
];

const PaywallSheet = ({ gateKey, onClose, onTrack }) => {
  const { t } = useLanguage();
  const [registered, setRegistered] = useState(false);

  const handleInterest = () => {
    onTrack?.(gateKey, GATE_ACTION.INTEREST);
    setRegistered(true);
  };

  const reasonKey = `reason_${gateKey}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 390, maxHeight: '88vh', overflowY: 'auto',
          backgroundColor: V('--th-card'),
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px calc(28px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            onClick={onClose}
            aria-label={t('common', 'cancel')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--th-text-sub)" />
          </button>
        </div>

        {/* 왜 막혔는지를 먼저 말한다. 게이트마다 문구가 다르다. */}
        <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: '0 0 6px' }}>
          {t('paywall', reasonKey)}
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: V('--th-text'), margin: '0 0 6px' }}>
          {t('paywall', 'title')}
        </h3>
        <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('paywall', 'subtitle')}
        </p>

        <div style={{ marginBottom: 20 }}>
          {FEATURES.map((f) => {
            const highlighted = f.gate === gateKey;
            return (
              <div
                key={f.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 12px', marginBottom: 8, borderRadius: 12,
                  backgroundColor: highlighted ? 'rgba(var(--th-primary-rgb), 0.1)' : V('--th-bg'),
                  border: `1px solid ${highlighted ? 'var(--th-primary)' : 'var(--th-border)'}`,
                }}
              >
                <Check size={16} color={highlighted ? 'var(--th-primary)' : 'var(--th-text-sub)'} />
                <span style={{
                  fontSize: 14, fontWeight: highlighted ? 700 : 500,
                  color: highlighted ? V('--th-primary') : V('--th-text'),
                }}>
                  {t('paywall', f.key)}
                </span>
              </div>
            );
          })}
        </div>

        {registered ? (
          <div style={{
            padding: '15px', borderRadius: 50, textAlign: 'center',
            backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: V('--th-text') }}>
              {t('paywall', 'registered')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: V('--th-text-sub') }}>
              {t('paywall', 'registeredDesc')}
            </p>
          </div>
        ) : (
          <button
            onClick={handleInterest}
            style={{
              width: '100%', padding: '15px', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700,
            }}
          >
            {t('paywall', 'registerInterest')}
          </button>
        )}

        {/* 아직 파는 물건이 아니라는 걸 분명히 한다 (앱 심사 대응 겸) */}
        <p style={{ margin: '12px 0 0', fontSize: 11, color: V('--th-text-sub'), textAlign: 'center', lineHeight: 1.5 }}>
          {t('paywall', 'notForSaleYet')}
        </p>
      </div>
    </div>
  );
};

export default PaywallSheet;
