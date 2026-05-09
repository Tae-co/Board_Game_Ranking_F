const shimmer = {
  background: 'linear-gradient(90deg, var(--th-card) 25%, var(--th-bg-deep) 50%, var(--th-card) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};

const style = document.createElement('style');
style.textContent = '@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }';
if (!document.head.querySelector('[data-shimmer]')) {
  style.setAttribute('data-shimmer', '1');
  document.head.appendChild(style);
}

export const Skeleton = ({ width = '100%', height = 16, radius = 8, style: s }) => (
  <div style={{ width, height, borderRadius: radius, flexShrink: 0, ...shimmer, ...s }} />
);

export const CommunityCardSkeleton = () => (
  <div style={{
    borderRadius: 20, padding: '20px 16px',
    border: '1px solid var(--th-border)',
    backgroundColor: 'var(--th-card)',
    display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Skeleton width={52} height={52} radius={14} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={11} />
      </div>
    </div>
    <Skeleton height={11} />
    <Skeleton width="50%" height={11} />
  </div>
);

export const MemberCardSkeleton = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px',
    borderRadius: 14,
    backgroundColor: 'var(--th-card)',
    border: '1px solid var(--th-border)',
  }}>
    <Skeleton width={40} height={40} radius="50%" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="45%" height={13} />
      <Skeleton width="30%" height={11} />
    </div>
  </div>
);

export const RankRowSkeleton = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    borderRadius: 14,
    backgroundColor: 'var(--th-card)',
    border: '1px solid var(--th-border)',
  }}>
    <Skeleton width={28} height={28} radius={8} />
    <Skeleton width={36} height={36} radius="50%" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="40%" height={13} />
      <Skeleton width="25%" height={11} />
    </div>
    <Skeleton width={48} height={22} radius={6} />
  </div>
);

export const GameCardSkeleton = () => (
  <div style={{
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'var(--th-card)',
    border: '1px solid var(--th-border)',
  }}>
    <Skeleton height={100} radius={0} />
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton width="70%" height={13} />
      <Skeleton width="50%" height={11} />
    </div>
  </div>
);
