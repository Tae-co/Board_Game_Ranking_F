import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import StorageImage from '../StorageImage';
import NavAvatar from '../NavAvatar';
import { V } from '../../utils/cssUtils';
import { getAvatarColorById as getAvatarColor } from '../../utils/avatarUtils';

const PER_PAGE = 10;

const RoomSettingsOverlay = ({
  onClose, onSave, onDeleteRoom,
  editRoomName, setEditRoomName,
  members, userId,
  saving, onKickMember, navigate, t,
}) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(members.length / PER_PAGE);
  const pagedMembers = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  return (
  <div style={{
    position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: '390px', zIndex: 100,
    backgroundColor: V('--th-bg'),
    overflowY: 'auto', paddingBottom: 100,
  }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px', position: 'sticky', top: 0, zIndex: 10,
      backgroundColor: V('--th-nav-bg'),
      borderBottom: `1px solid var(--th-border)`,
    }}>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}>
        <ArrowLeft style={{ width: 24, height: 24 }} />
      </button>
      <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>Manage Group</h1>
      <NavAvatar />
    </div>

    <div style={{ padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Group Identity */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: V('--th-text'), margin: 0 }}>Group identity</h2>
        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'color-mix(in srgb, var(--th-primary) 12%, transparent)', color: 'var(--th-primary)', border: '1px solid var(--th-primary)' }}>
          ACTIVE SESSION
        </span>
      </div>

      {/* Room Name Input */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: V('--th-text-sub'), display: 'block', marginBottom: '8px' }}>GROUP NAME</label>
        <input
          value={editRoomName}
          onChange={(e) => setEditRoomName(e.target.value)}
          style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'), color: V('--th-text'), fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Members */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>{t('invite', 'members')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: V('--th-text-sub') }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text-sub') }}>{members.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {pagedMembers.map((member) => {
            const isMe = member.memberId === userId;
            const canKick = !isMe && !member.isHost;
            return (
              <div key={member.memberId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderBottom: `1px solid var(--th-border)` }}>
                <div style={{ flexShrink: 0, width: 44, height: 44 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: getAvatarColor(member.memberId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', overflow: 'hidden' }}>
                    {member.profileImage
                      ? <StorageImage src={member.profileImage} alt={member.nickname} loading="lazy" decoding="async" transform={{ width: 72, height: 72, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : member.nickname[0].toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: isMe ? '700' : '600', color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.nickname}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: member.isHost ? 'var(--th-primary)' : V('--th-text-sub'), marginTop: '1px' }}>{member.isHost ? 'HOST' : 'PLAYER'}</div>
                </div>
                {canKick && (
                  <button onClick={() => onKickMember(member)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', flexShrink: 0, color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'), color: page === 0 ? V('--th-text-sub') : V('--th-text'), cursor: page === 0 ? 'not-allowed' : 'pointer' }}
            >
              ‹
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: V('--th-text-sub') }}>{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'), color: page >= totalPages - 1 ? V('--th-text-sub') : V('--th-text'), cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Bottom Buttons */}
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', padding: '12px 20px calc(28px + env(safe-area-inset-bottom))', backgroundColor: V('--th-bg'), display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button onClick={onDeleteRoom} style={{ width: '100%', padding: '14px', borderRadius: '50px', backgroundColor: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>Delete Group</button>
      <button onClick={onSave} disabled={saving || !editRoomName.trim()} style={{ width: '100%', padding: '15px', borderRadius: '50px', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)', border: 'none', opacity: saving ? 0.7 : 1, fontSize: '15px', fontWeight: '700', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(107, 92, 231, 0.4)' }}>
        {saving ? 'Saving...' : 'Save the change'}
      </button>
    </div>
  </div>
  );
};

export default RoomSettingsOverlay;
