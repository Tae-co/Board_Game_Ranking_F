import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Crown } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useSubscription } from '../hooks/useSubscription';
import { BILLING, formatDate, formatPrice } from '../constants/subscription';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

/**
 * 구독 관리. **결제 로직 없음 — 로컬 상태만 읽고 쓴다.**
 *
 * 해지해도 남은 기간은 살려둔다. 문서가 Meetup에서 버리기로 한 "인질 모델"의
 * 반대편이다 — 낸 돈만큼은 쓰게 한다.
 */
const SubscriptionManage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const { subscription, plan, active, canceled, expiresAt, cancel, resume } = useSubscription();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const header = (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)`,
    }}>
      <div style={{
        maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 20px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={22} color="var(--th-primary)" />
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--th-primary)' }}>
            {t('subscription', 'manageTitle')}
          </span>
        </button>
        <NavAvatar />
      </div>
    </div>
  );

  /* ── 구독 없음 ───────────────────────────────────────────── */
  if (!active) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
        {header}
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18, margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: V('--th-bg-deep'),
          }}>
            <Crown size={26} color="var(--th-text-sub)" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: V('--th-text'), margin: '0 0 8px' }}>
            {t('subscription', 'noneTitle')}
          </h2>
          <p style={{ fontSize: 13.5, color: V('--th-text-sub'), margin: '0 0 26px', lineHeight: 1.6 }}>
            {t('subscription', 'noneDesc')}
          </p>
          <button
            onClick={() => navigate('/subscription')}
            style={{
              width: '100%', padding: '15px', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700,
            }}
          >
            {t('subscription', 'seePlans')}
          </button>
        </div>
      </div>
    );
  }

  /* ── 구독 중 ─────────────────────────────────────────────── */
  const yearly = subscription.billing === BILLING.YEARLY;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      {header}

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* 현재 플랜 카드 */}
        <div style={{
          borderRadius: 20, padding: '22px 20px', marginBottom: 16,
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Crown size={18} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
              {t('subscription', 'title')}
            </span>
            <span style={{
              marginLeft: 'auto', padding: '4px 10px', borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 700,
            }}>
              {t('subscription', canceled ? 'statusCanceled' : 'statusActive')}
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
            {formatPrice(plan.price, lang)}
            <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
              {t('subscription', yearly ? 'perYear' : 'perMonth')}
            </span>
          </p>
        </div>

        {/* 해지 예약 안내 */}
        {canceled && (
          <div style={{
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
            backgroundColor: 'rgba(var(--th-primary-rgb), 0.08)',
            border: `1px solid var(--th-primary)`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: V('--th-text'), fontWeight: 600, lineHeight: 1.5 }}>
              {fill(t('subscription', 'canceledNotice'), { date: formatDate(expiresAt, lang) })}
            </p>
          </div>
        )}

        {/* 상세 */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: 18,
          border: `1px solid var(--th-border)`, padding: '4px 16px', marginBottom: 20,
        }}>
          {[
            {
              label: t('subscription', 'currentPlan'),
              value: t('subscription', yearly ? 'confirmPlanYearly' : 'confirmPlanMonthly'),
            },
            {
              label: t('subscription', canceled ? 'expiresOn' : 'nextBilling'),
              value: formatDate(expiresAt, lang),
            },
            {
              label: t('subscription', 'paymentMethod'),
              value: t('subscription', 'paymentMethodNone'),
              icon: <CreditCard size={15} color="var(--th-text-sub)" />,
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '15px 0',
                borderBottom: i < arr.length - 1 ? `1px solid var(--th-border)` : 'none',
              }}
            >
              <span style={{ fontSize: 13.5, color: V('--th-text-sub') }}>{row.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: V('--th-text') }}>
                {row.icon}
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {canceled ? (
          <button
            onClick={() => { resume(); }}
            style={{
              width: '100%', padding: '15px', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 10,
            }}
          >
            {t('subscription', 'resumeCta')}
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/subscription')}
              style={{
                width: '100%', padding: '15px', borderRadius: 50, cursor: 'pointer',
                backgroundColor: V('--th-btn-ghost-bg'), border: `1px solid var(--th-btn-ghost-border)`,
                color: V('--th-text'), fontSize: 15, fontWeight: 700, marginBottom: 10,
              }}
            >
              {t('subscription', 'changePlan')}
            </button>
            <button
              onClick={() => setConfirmingCancel(true)}
              style={{
                width: '100%', padding: '15px', borderRadius: 50, cursor: 'pointer',
                backgroundColor: 'transparent', border: 'none',
                color: V('--th-text-sub'), fontSize: 14, fontWeight: 600,
              }}
            >
              {t('subscription', 'cancelCta')}
            </button>
          </>
        )}

        <p style={{ margin: '14px 0 0', fontSize: 11, color: V('--th-text-sub'), textAlign: 'center' }}>
          {t('subscription', 'prototypeNotice')}
        </p>
      </div>

      {/* 해지 확인 */}
      {confirmingCancel && (
        <div
          onClick={() => setConfirmingCancel(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 330, backgroundColor: V('--th-card'),
              borderRadius: 20, padding: '24px 20px', textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 800, color: V('--th-text'), margin: '0 0 10px' }}>
              {t('subscription', 'cancelConfirmTitle')}
            </h3>
            <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: '0 0 22px', lineHeight: 1.6 }}>
              {fill(t('subscription', 'cancelConfirmDesc'), { date: formatDate(expiresAt, lang) })}
            </p>
            <button
              onClick={() => setConfirmingCancel(false)}
              style={{
                width: '100%', padding: '14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 8,
              }}
            >
              {t('subscription', 'cancelConfirmKeep')}
            </button>
            <button
              onClick={async () => { setConfirmingCancel(false); await cancel(); }}
              style={{
                width: '100%', padding: '14px', borderRadius: 50, cursor: 'pointer',
                backgroundColor: 'transparent', border: 'none',
                color: '#EF4444', fontSize: 14, fontWeight: 700,
              }}
            >
              {t('subscription', 'cancelConfirmDo')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManage;
