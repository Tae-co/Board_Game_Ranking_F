import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;
const nickname = () => localStorage.getItem('nickname') || '?';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');

  const [roomName, setRoomName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameSearch, setGameSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const filteredGames = gameSearch
    ? games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
    : games;

  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleGameSearch = (value) => {
    setGameSearch(value);
    setCurrentPage(1);
  };

  const handleCreate = async () => {
    if (!roomName.trim() || !selectedGameId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/rooms', {
        roomName: roomName.trim(),
        memberId: Number(userId),
        boardGameId: selectedGameId,
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate(`/invite/${res.data.roomId}`);
    } catch {
      alert(t('lobby', 'createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid var(--th-border)`,
        backgroundColor: V('--th-nav-bg'), position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <button
            onClick={() => navigate('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
          >
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text'), flex: 1 }}>
            {t('lobby', 'createGroup')}
          </h1>
        </div>
        <div
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'var(--th-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {nickname()[0].toUpperCase()}
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* Group Name */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: '10px' }}>
            GROUP NAME
          </p>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('lobby', 'groupNamePlaceholder')}
            autoFocus
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
              color: V('--th-text'), fontSize: '15px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
          />
        </div>

        {/* Select Game */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: '10px' }}>
            SELECT GAME
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              width: 14, height: 14, color: V('--th-text-sub'),
            }} />
            <input
              type="text"
              value={gameSearch}
              onChange={(e) => handleGameSearch(e.target.value)}
              placeholder={t('lobby', 'gameSearchPlaceholder')}
              style={{
                width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                color: V('--th-text'), fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
          </div>

          {/* Game Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {pagedGames.map((game) => {
              const selected = selectedGameId === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  style={{
                    borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                    backgroundColor: V('--th-card'),
                    transition: 'border-color 0.2s',
                  }}
                >
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                      🎲
                    </div>
                  )}
                  <p style={{
                    fontSize: '11px', padding: '6px 4px', textAlign: 'center',
                    color: selected ? V('--th-primary') : V('--th-text'),
                    fontWeight: selected ? '700' : '400',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    margin: 0,
                  }}>
                    {game.name}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 32, height: 32, borderRadius: '8px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: currentPage === page ? '700' : '400',
                    backgroundColor: currentPage === page ? 'var(--th-primary)' : 'var(--th-card)',
                    color: currentPage === page ? '#fff' : 'var(--th-text-sub)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Create Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '390px', padding: '12px 20px 24px',
        backgroundColor: V('--th-nav-bg'), borderTop: `1px solid var(--th-border)`,
      }}>
        <button
          onClick={handleCreate}
          disabled={isSubmitting || !roomName.trim() || !selectedGameId}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            backgroundColor: 'var(--th-primary)', color: '#FFFFFF',
            fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer',
            opacity: (isSubmitting || !roomName.trim() || !selectedGameId) ? 0.4 : 1,
          }}
        >
          {isSubmitting ? t('lobby', 'creating') : t('lobby', 'createRoom')}
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
