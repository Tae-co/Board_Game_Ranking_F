import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { GATE_ACTION } from '../../constants/gates';
import { BILLING, PLANS, PRO_FEATURES, formatPrice } from '../../constants/subscription';
import PlanComparisonTable from '../shared/PlanComparisonTable';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

/**
 * 게이트에 막혔을 때 뜨는 시트. **결제 로직은 없다 — 구독 페이지도 목업이다.**
 *
 * 전부 규모가 커졌을 때 운영자가 혼자 감당하는 것들이다. 랭킹·기록·점수판은
 * 여기에 올리지 않는다 — 유료 상품이 아니라 사람을 다시 오게 만드는 엔진이다.
 *
 * 목록은 구독 안내 페이지와 PRO_FEATURES를 공유한다. 두 곳에 따로 두면 어긋난다.
 */
const PaywallSheet = ({ gateKey, onClose, onTrack }) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  // 게이트에서 구독 페이지로 넘어간 것 자체가 지불 의사 신호다 (전환율 = INTEREST / HIT)
  const handleSubscribe = () => {
    onTrack?.(gateKey, GATE_ACTION.INTEREST);
    navigate('/subscription');
  };

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

        {/* 왜 막혔는지를 먼저 말한다. 한도 숫자는 FREE_LIMITS에서 채운다 — 문구에 박아두면 거짓말이 된다. */}
        <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: '0 0 6px' }}>
          {fill(t('paywall', `reason_${gateKey}`), {
            n: PRO_FEATURES.find((f) => f.gate === gateKey)?.free ?? '',
          })}
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: V('--th-text'), margin: '0 0 6px' }}>
          {t('paywall', 'title')}
        </h3>
        <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: '0 0 18px', lineHeight: 1.5 }}>
          {t('paywall', 'subtitle')}
        </p>

        {/* 가격 */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: V('--th-text') }}>
            {formatPrice(PLANS[BILLING.MONTHLY].price, lang)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text-sub') }}>
            {t('subscription', 'perMonth')}
          </span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: V('--th-primary'), textAlign: 'center', fontWeight: 600 }}>
          {fill(t('paywall', 'priceHint'), {
            price: formatPrice(PLANS[BILLING.YEARLY].price, lang),
          })}
        </p>

        {/* 막힌 지점을 표에서 짚어준다 */}
        <div style={{ marginBottom: 18 }}>
          <PlanComparisonTable highlightGate={gateKey} />
        </div>

        {/* 랭킹이 유료가 아니라는 걸 페이월 안에서 못박는다 */}
        <p style={{
          margin: '0 0 16px', fontSize: 12, color: V('--th-text-sub'),
          textAlign: 'center', lineHeight: 1.5,
        }}>
          {t('paywall', 'freeForever')}
        </p>

        <button
          onClick={handleSubscribe}
          style={{
            width: '100%', padding: '15px', borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700,
          }}
        >
          {t('subscription', 'subscribeCta')}
        </button>

        <p style={{ margin: '12px 0 0', fontSize: 11, color: V('--th-text-sub'), textAlign: 'center', lineHeight: 1.5 }}>
          {t('subscription', 'prototypeNotice')}
        </p>
      </div>
    </div>
  );
};

export default PaywallSheet;
