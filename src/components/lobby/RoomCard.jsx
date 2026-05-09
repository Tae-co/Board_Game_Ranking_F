import { Users } from 'lucide-react';
import StorageImage from '../StorageImage';
import { V } from '../../utils/cssUtils';

const RoomCard = ({ room, imageUrl, isMember, communityId, onClick }) => (
  <div
    onClick={onClick}
    style={{
      borderRadius: '16px',
      backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      cursor: 'pointer', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}
  >
    <div style={{
      width: '100%', height: '80px',
      backgroundColor: 'rgba(107,92,231,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {imageUrl ? (
        <StorageImage src={imageUrl} alt={room.roomName} loading="lazy" decoding="async" transform={{ width: 160, height: 160, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: '28px' }}>🎲</span>
      )}
    </div>
    <div style={{ padding: '8px 8px 10px', flex: 1 }}>
      <div style={{
        fontWeight: '700', color: V('--th-text'), fontSize: '12px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        marginBottom: '4px',
      }}>
        {room.roomName}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Users style={{ width: 10, height: 10, color: V('--th-text-sub') }} />
        <span style={{ fontSize: '10px', color: V('--th-text-sub'), fontWeight: '500' }}>
          {room.memberCount ?? '—'}명
        </span>
        {communityId && isMember && (
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--th-primary)' }}>· 참가중</span>
        )}
      </div>
    </div>
  </div>
);

export default RoomCard;
