import { Link } from 'react-router-dom';

const s = {
  body: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', color: '#1a1a1a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { padding: '24px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', textDecoration: 'none' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' },
  appIcon: { width: '120px', height: '120px', borderRadius: '28px', background: '#f3f1ff', border: '1px solid #e0d9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 4px 24px rgba(107,92,231,0.12)' },
  h1: { fontSize: '42px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '16px', color: '#1a1a1a' },
  tagline: { fontSize: '17px', color: '#555', lineHeight: '1.7', maxWidth: '480px', marginBottom: '48px' },
  badges: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' },
  badgeBase: { display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' },
  badgeDisabled: { background: '#e8e8e8', color: '#999', cursor: 'default', pointerEvents: 'none' },
  badgeApple: { background: '#1a1a1a', color: '#fff', cursor: 'pointer' },
  badgeWeb: { background: '#6B5CE7', color: '#fff', cursor: 'pointer' },
  badgeLabel: { fontSize: '10px', opacity: '0.7', display: 'block' },
  badgeStore: { fontSize: '15px', fontWeight: '700', display: 'block' },
  features: { display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' },
  feature: { background: '#f7f7f7', borderRadius: '16px', padding: '24px', flex: '1', minWidth: '160px', maxWidth: '180px', textAlign: 'center' },
  featureIcon: { fontSize: '28px', marginBottom: '10px' },
  featureTitle: { fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1a1a1a' },
  featureDesc: { fontSize: '12px', color: '#777', lineHeight: '1.5' },
  footer: { padding: '24px 32px', textAlign: 'center', fontSize: '12px', color: '#aaa', borderTop: '1px solid #f0f0f0' },
  footerLink: { color: '#888', textDecoration: 'none' },
};

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.18 23.76c.3.17.64.22.99.14l12.47-7.19-2.52-2.52-10.94 9.57zm-1.71-20.3C1.17 3.83 1 4.22 1 4.69v14.62c0 .47.17.86.47 1.13l.06.05 8.19-8.19v-.19L1.53 3.92l-.06.05zm18.52 7.89-2.63-1.51-2.83 2.83 2.83 2.83 2.66-1.53c.76-.44.76-1.15-.03-1.62zm-17.9 10.46 10.94-9.57-2.52-2.52L1.47 19.3l.62.51z" />
  </svg>
);

const WebIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const features = [
  { icon: '🎲', title: 'Board Game Friendly', desc: 'Built for offline communities who play together regularly' },
  { icon: '📊', title: 'TrueSkill Rating', desc: 'Fair and accurate rankings using the TrueSkill algorithm' },
  { icon: '👥', title: 'Group Rooms', desc: 'Create private rooms and invite your friends to track results' },
];

export default function LandingPage() {
  return (
    <div style={s.body}>
      <header style={s.header}>
        <img src="/logo.png" width="36" height="36" style={{ borderRadius: '10px', objectFit: 'contain' }} alt="YadaRank" />
        <span style={s.logoText}>YadaRank</span>
      </header>

      <main style={s.main}>
        <div style={s.appIcon}>
          <img src="/logo.png" width="80" height="80" style={{ objectFit: 'contain' }} alt="YadaRank" />
        </div>

        <h1 style={s.h1}>YadaRank</h1>
        <p style={s.tagline}>
          A simplified ranking system designed for offline board game communities.
          We use the TrueSkill rating system to calculate player rankings.
        </p>

        <div style={s.badges}>
          <a href="https://apps.apple.com/kr/app/yadarank/id6768907330" target="_blank" rel="noopener noreferrer" style={{ ...s.badgeBase, ...s.badgeApple }}>
            <AppleIcon />
            <div>
              <span style={s.badgeLabel}>Download on the</span>
              <span style={s.badgeStore}>App Store</span>
            </div>
          </a>
          <span style={{ ...s.badgeBase, ...s.badgeDisabled }}>
            <PlayIcon />
            <div>
              <span style={s.badgeLabel}>Coming soon on</span>
              <span style={s.badgeStore}>Google Play</span>
            </div>
          </span>
          <Link to="/login" style={{ ...s.badgeBase, ...s.badgeWeb }}>
            <WebIcon />
            <div>
              <span style={s.badgeLabel}>Play on</span>
              <span style={s.badgeStore}>Web</span>
            </div>
          </Link>
        </div>

        <div style={s.features}>
          {features.map((f) => (
            <div key={f.title} style={s.feature}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureTitle}>{f.title}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer style={s.footer}>
        <p>
          © 2026 YadaRank ·{' '}
          <a href="/privacy" style={s.footerLink}>Privacy Policy</a>
          {' · '}
          <a href="/delete" style={s.footerLink}>Delete Account</a>
        </p>
      </footer>
    </div>
  );
}
