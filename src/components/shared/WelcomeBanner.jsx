/** 로비·커뮤니티 목록 맨 위 인사 배너 */
const WelcomeBanner = ({ nickname, t, marginBottom = '24px' }) => (
  <div style={{
    borderRadius: '20px',
    padding: '24px 22px',
    marginBottom,
    background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', right: -20, bottom: -20,
      width: 120, height: 120, borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.07)',
    }}/>
    <div style={{
      position: 'absolute', right: 30, top: -30,
      width: 80, height: 80, borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.05)',
    }}/>
    <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
      {t('lobby', 'heroGreeting').replace('{name}', nickname)}
    </p>
    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
      {t('lobby', 'heroSubLine1')}<br/>{t('lobby', 'heroSubLine2')}
    </p>
  </div>
);

export default WelcomeBanner;
