import { useState } from 'react';
import { X, Bug, MessageSquare } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { useLanguage } from '../../i18n/LanguageContext';

const FEEDBACK_EMAIL = 'taecodev66@gmail.com';

const FeedbackModal = ({ onClose }) => {
  const { t } = useLanguage();
  const [type, setType] = useState('feedback');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent(
      type === 'bug' ? '[Bug Report] BoardUp' : '[Feedback] BoardUp'
    );
    const body = encodeURIComponent(message.trim());
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, zIndex: 201,
        backgroundColor: V('--th-card'),
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 36px',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: V('--th-border'), margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: V('--th-text') }}>
            {t('profile', 'feedbackTitle')}
          </span>
          <button onClick={onClose} style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: V('--th-text-sub') }}>
            <X size={20} />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'feedback', icon: <MessageSquare size={14} />, label: t('profile', 'feedbackTypeFeedback') },
            { key: 'bug', icon: <Bug size={14} />, label: t('profile', 'feedbackTypeBug') },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                border: `1.5px solid ${type === key ? 'var(--th-primary)' : 'var(--th-border)'}`,
                backgroundColor: type === key ? 'var(--th-primary)' : 'transparent',
                color: type === key ? '#fff' : V('--th-text-sub'),
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('profile', 'feedbackPlaceholder')}
          autoFocus
          maxLength={1000}
          style={{
            width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 14,
            fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none',
            backgroundColor: V('--th-bg'), color: V('--th-text'),
            border: `1.5px solid var(--th-border)`, boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <p style={{ fontSize: 11, color: V('--th-text-sub'), textAlign: 'right', margin: '4px 0 16px' }}>
          {message.length} / 1000
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim()}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 50, border: 'none',
            fontSize: 14, fontWeight: 700,
            backgroundColor: 'var(--th-primary)', color: '#fff',
            opacity: message.trim() ? 1 : 0.4,
            cursor: message.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {t('profile', 'feedbackSubmit')}
        </button>
      </div>
    </>
  );
};

export default FeedbackModal;
