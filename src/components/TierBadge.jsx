import { motion } from 'motion/react';

function TierEmblem({ tier, size }) {
  const sizeValue = size === 'sm' ? 32 : size === 'md' ? 40 : 56;

  return (
    <svg width={sizeValue} height={sizeValue} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`tier-gradient-${tier.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={tier.gradientFrom} />
          <stop offset="100%" stopColor={tier.gradientTo} />
        </linearGradient>
        <linearGradient id={`tier-shine-${tier.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={`glow-${tier.name}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#tier-gradient-${tier.name})`} stroke={tier.accentColor} strokeWidth="2" filter={`url(#glow-${tier.name})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={tier.accentColor} strokeWidth="1" opacity="0.5" />
      <path d="M50 15 L70 35 L70 65 L50 85 L30 65 L30 35 Z" fill={tier.color} stroke={tier.accentColor} strokeWidth="2" opacity="0.9" />
      <path d="M50 25 L63 40 L63 60 L50 75 L37 60 L37 40 Z" fill={`url(#tier-shine-${tier.name})`} opacity="0.6" />
      {tier.name === '다이아몬드' ? (
        <>
          <path d="M50 35 L55 45 L50 55 L45 45 Z" fill="white" opacity="0.9" />
          <circle cx="50" cy="45" r="3" fill="white" opacity="0.9" />
        </>
      ) : tier.name === '플래티넘' ? (
        <polygon points="50,38 52,44 58,44 53,48 55,54 50,50 45,54 47,48 42,44 48,44" fill="white" opacity="0.8" />
      ) : tier.name === '골드' ? (
        <>
          <circle cx="50" cy="45" r="5" fill={tier.accentColor} opacity="0.9" />
          <circle cx="50" cy="45" r="3" fill="white" opacity="0.9" />
        </>
      ) : (
        <circle cx="50" cy="45" r="4" fill={tier.accentColor} opacity="0.7" />
      )}
      <polygon points="50,10 52,18 48,18" fill={tier.accentColor} opacity="0.8" />
      <circle cx="23" cy="50" r="3" fill={tier.accentColor} opacity="0.6" />
      <circle cx="77" cy="50" r="3" fill={tier.accentColor} opacity="0.6" />
    </svg>
  );
}

export function TierBadge({ tier, size = 'md' }) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} flex items-center justify-center`}
      style={{ filter: `drop-shadow(0 4px 8px ${tier.shadowColor}) drop-shadow(0 0 12px ${tier.glowColor})` }}
      whileHover={{
        scale: 1.15,
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.6 },
      }}
    >
      {(tier.name === '다이아몬드' || tier.name === '플래티넘') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${tier.glowColor} 0%, transparent 70%)` }}
          whileHover={{ rotate: 360, scale: [1, 1.2, 1], transition: { rotate: { duration: 1, ease: 'linear' }, scale: { duration: 0.5 } } }}
        />
      )}
      <motion.div whileHover={tier.name === '다이아몬드' ? { rotate: 360, transition: { duration: 1, ease: 'linear' } } : {}}>
        <TierEmblem tier={tier} size={size} />
      </motion.div>
    </motion.div>
  );
}

export const TIERS = {
  bronze: { name: '브론즈', color: '#8B4513', gradientFrom: '#CD7F32', gradientTo: '#6B3410', shadowColor: 'rgba(205, 127, 50, 0.5)', glowColor: 'rgba(205, 127, 50, 0.4)', accentColor: '#CD7F32', minPoints: 0, maxPoints: 999 },
  silver: { name: '실버', color: '#A8A8A8', gradientFrom: '#E8E8E8', gradientTo: '#808080', shadowColor: 'rgba(192, 192, 192, 0.5)', glowColor: 'rgba(192, 192, 192, 0.4)', accentColor: '#C0C0C0', minPoints: 1000, maxPoints: 1499 },
  gold: { name: '골드', color: '#D4AF37', gradientFrom: '#FFD700', gradientTo: '#B8860B', shadowColor: 'rgba(255, 215, 0, 0.6)', glowColor: 'rgba(255, 215, 0, 0.5)', accentColor: '#FFF4C2', minPoints: 1500, maxPoints: 1999 },
  platinum: { name: '플래티넘', color: '#4A9B94', gradientFrom: '#5FD3C8', gradientTo: '#2F8B85', shadowColor: 'rgba(95, 211, 200, 0.6)', glowColor: 'rgba(95, 211, 200, 0.5)', accentColor: '#A0FFF5', minPoints: 2000, maxPoints: 2499 },
  diamond: { name: '다이아몬드', color: '#3B4EBF', gradientFrom: '#6B8EFF', gradientTo: '#1E3A8A', shadowColor: 'rgba(59, 78, 191, 0.7)', glowColor: 'rgba(107, 142, 255, 0.6)', accentColor: '#A0BBFF', minPoints: 2500, maxPoints: 9999 },
};
