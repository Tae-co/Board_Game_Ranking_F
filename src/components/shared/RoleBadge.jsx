import { useLanguage } from '../../i18n/LanguageContext';

/** 커뮤니티 소유자·어드민 배지. 소유자는 채운 배지, 어드민은 테두리 배지. */
const RoleBadge = ({ owner }) => {
  const { t } = useLanguage();
  return (
    <span style={{
      flexShrink: 0, fontSize: '11px', fontWeight: '700',
      borderRadius: '20px', padding: '1px 7px',
      color: owner ? '#fff' : 'var(--th-primary)',
      backgroundColor: owner ? 'var(--th-primary)' : 'transparent',
      border: `1px solid var(--th-primary)`,
    }}>
      {t('community', owner ? 'ownerBadge' : 'adminBadge')}
    </span>
  );
};

export default RoleBadge;
