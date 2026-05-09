import { useState } from 'react';
import { Users } from 'lucide-react';
import StorageImage from '../StorageImage';

const GameCard = ({ gameInfo }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div style={{
      borderRadius: '18px', overflow: 'hidden',
      position: 'relative', height: '240px',
      border: '2px solid rgba(107,92,231,0.35)',
      boxShadow: '0 4px 20px rgba(107,92,231,0.18)',
      backgroundColor: 'var(--th-card)',
    }}>
      {(!gameInfo || !imgLoaded) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, var(--th-card) 25%, var(--th-bg-deep) 50%, var(--th-card) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      )}
      {gameInfo && (
        <>
          <StorageImage
            src={gameInfo.imageUrl}
            alt={gameInfo.name}
            onLoad={() => setImgLoaded(true)}
            transform={{ width: 780, height: 480, quality: 72 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 18px',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s',
          }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 5px', letterSpacing: '0.02em' }}>
                {gameInfo.name.toUpperCase()}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={13} color="rgba(255,255,255,0.75)" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
                  {gameInfo.minPlayers}-{gameInfo.maxPlayers} Players
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
              color: '#fff', backgroundColor: 'var(--th-primary)',
              padding: '5px 13px', borderRadius: '20px',
            }}>
              STRATEGY
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default GameCard;
