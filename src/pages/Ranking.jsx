import { memo, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Share2, ArrowLeft, Trophy, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TierBadge, TIERS } from '../components/TierBadge';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const getTier = (points) => {
  if (points >= TIERS.diamond.minPoints) return TIERS.diamond;
  if (points >= TIERS.platinum.minPoints) return TIERS.platinum;
  if (points >= TIERS.gold.minPoints) return TIERS.gold;
  if (points >= TIERS.silver.minPoints) return TIERS.silver;
  return TIERS.bronze;
};

const buildSavedScores = (participants) => {
  const savedScores = {};
  participants.forEach((p) => {
    if (!p.scoresJson) return;
    try {
      const parsed = JSON.parse(p.scoresJson);
      Object.entries(parsed).forEach(([catKey, val]) => {
        if (!savedScores[catKey]) savedScores[catKey] = {};
        savedScores[catKey][p.memberId] = val;
      });
    } catch {
      // Ignore legacy or malformed score payloads when opening past matches.
    }
  });
  return Object.keys(savedScores).length > 0 ? savedScores : null;
};

const MatchCard = memo(function MatchCard({ match, isHost, onEdit, onDelete, onView, onShare }) {
  return (
    <div style={{ borderRadius: '14px', padding: '14px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', color: V('--th-text-sub') }}>{match.gameName}</p>
          <p style={{ fontSize: '13px', fontWeight: '600', color: V('--th-text') }}>{formatDate(match.playedAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isHost ? (
            <>
              <button onClick={() => onEdit(match)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', backgroundColor: V('--th-bg'), color: V('--th-primary'), border: `1px solid var(--th-primary)`, cursor: 'pointer' }}>수정</button>
              <button onClick={() => onDelete(match.matchId)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', backgroundColor: V('--th-bg'), color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer' }}>삭제</button>
            </>
          ) : (
            <button onClick={() => onView(match)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}>상세</button>
          )}
          <button onClick={() => onShare(match)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Share2 style={{ color: V('--th-text-sub'), width: '15px', height: '15px' }} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {match.participants.map((p) => (
          <div key={p.memberId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                backgroundColor: p.placement === 1 ? '#D4AF37' : p.placement === 2 ? '#9CA3AF' : p.placement === 3 ? '#92400E' : V('--th-border'),
                color: '#FFFFFF',
              }}>{p.placement}</span>
              <span style={{ fontSize: '13px', color: V('--th-text') }}>{p.nickname}</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: p.ratingChange > 0 ? '#16a34a' : '#dc2626' }}>
              {p.ratingChange > 0 ? '+' : ''}{Math.round(p.ratingChange)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

const RankingRow = memo(function RankingRow({ rank, rankNum, isMe, isHost, isTopThree, onEdit }) {
  const tier = getTier(Math.round(rank.rating));
  const winRate = (rank.winCount + rank.loseCount) > 0
    ? Math.round(rank.winCount / (rank.winCount + rank.loseCount) * 100)
    : 0;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px', borderRadius: '12px',
        backgroundColor: isMe ? V('--th-bg-deep') : V('--th-card'),
        border: `1px solid ${isMe ? 'var(--th-primary)' : 'var(--th-border)'}`,
      }}
    >
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: isTopThree ? (rankNum === 1 ? '#FFD700' : rankNum === 2 ? '#C0C0C0' : '#CD7F32') : V('--th-primary'),
        color: isTopThree ? '#1a1a1a' : '#FFFFFF', fontSize: '12px', fontWeight: '700',
      }}>
        {rankNum}
      </div>

      <TierBadge tier={tier} size="sm" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <p style={{ fontSize: '14px', fontWeight: isMe ? '700' : '500', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rank.nickname}
          </p>
          {isMe && (
            <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '8px', backgroundColor: V('--th-primary'), color: '#FFFFFF', fontWeight: '700', flexShrink: 0 }}>ME</span>
          )}
        </div>
        <p style={{ fontSize: '10px', color: V('--th-text-sub'), whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: '700' }}>W</span>{rank.winCount ?? 0}{' '}
          <span style={{ fontWeight: '700' }}>L</span>{rank.loseCount ?? 0}{' '}
          <span style={{ fontWeight: '700' }}>WR</span>{winRate}%
        </p>
      </div>

      {isHost && (
        <button
          onClick={() => onEdit(rank)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
        >
          <Pencil style={{ width: '14px', height: '14px', color: V('--th-text-sub') }} />
        </button>
      )}

      <span style={{ fontSize: '15px', fontWeight: '700', color: V('--th-primary'), flexShrink: 0 }}>
        {Math.round(rank.rating)}
      </span>
    </div>
  );
});

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState('group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const myNickname = localStorage.getItem('nickname');
  const myUserId = Number(localStorage.getItem('userId'));


  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}`); return res.data; },
    staleTime: 1000 * 60 * 10,
  });

  const { data: roomMembers = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/members`); return res.data || []; },
    staleTime: 1000 * 60 * 2,
  });

  const isHost = useMemo(
    () => roomMembers.find(m => m.memberId === myUserId)?.isHost ?? false,
    [roomMembers, myUserId]
  );

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/rankings`); return res.data || []; },
    enabled: activeTab === 'group',
    staleTime: 1000 * 60 * 3,
  });

  const { data: matches = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/matches`); return res.data || []; },
    enabled: activeTab === 'matches',
    staleTime: 1000 * 60 * 1,
  });

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await api.put(`/rooms/${roomId}/members/${ratingEditModal.memberId}/rating`, {
        requesterId: myUserId, rating: val,
      });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      setRatingEditModal(null);
    } catch { alert(t('ranking', 'editRatingFailed')); }
    finally { setIsRatingEditSaving(false); }
  };

  const shareText = (text) => {
    if (navigator.share) { navigator.share({ text }).catch(() => {}); }
    else { navigator.clipboard?.writeText(text); }
  };

  const handleShareRanking = () => {
    const roomName = room?.roomName ?? '';
    const lines = rankings.slice(0, 5).map((r, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}위`;
      const rate = r.winCount + r.loseCount > 0 ? Math.round(r.winCount / (r.winCount + r.loseCount) * 100) : 0;
      return `${medal} ${r.nickname}  ${Math.round(r.rating)}LP  W${r.winCount} L${r.loseCount}  ${rate}%`;
    });
    shareText(`🏆 ${roomName} 그룹 랭킹\n\n${lines.join('\n')}\n\n🎲 boardup.pages.dev`);
  };

  const handleShareMatch = (match) => {
    const lines = [...match.participants].sort((a, b) => a.placement - b.placement).map((p, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}위`;
      const sign = p.ratingChange >= 0 ? '+' : '';
      return `${medal} ${p.nickname}  ${sign}${Math.round(p.ratingChange)}LP`;
    });
    shareText(`🎮 오늘의 매치 결과 - ${match.gameName}\n\n${lines.join('\n')}`);
  };

  const openScoreSheet = useCallback((match, readOnly = false) => {
    const savedScores = buildSavedScores(match.participants);
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId), gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        savedScores,
        backTo: `/ranking/${roomId}`,
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/matches/${matchId}?requesterId=${myUserId}`);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch { alert('삭제에 실패했습니다.'); }
  }, [myUserId, queryClient, refetchMatches, roomId]);

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  const pagedRankings = useMemo(
    () => rankings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [rankings, page]
  );
  const totalPages = useMemo(() => Math.ceil(rankings.length / PAGE_SIZE), [rankings.length]);
  const isLoading = useMemo(
    () => activeTab === 'matches' ? isMatchesLoading : isRankingLoading,
    [activeTab, isMatchesLoading, isRankingLoading]
  );

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: V('--th-bg') }}>
      {/* Dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, var(--th-dot) 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '24px 16px 16px',
          position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-bg'),
        }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', padding: '6px' }}>
            <ArrowLeft style={{ color: V('--th-primary'), width: '24px', height: '24px' }} />
          </button>
          <Trophy style={{ color: V('--th-primary'), width: '20px', height: '20px', marginRight: '8px' }} />
          <h1 style={{ fontSize: '15px', fontWeight: '600', color: V('--th-text'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room?.roomName ? `${room.roomName} ${t('ranking', 'title')}` : t('ranking', 'title')}
          </h1>
          <button onClick={handleShareRanking} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <Share2 style={{ color: V('--th-text-sub'), width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', borderRadius: '24px', padding: '4px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            {[
              { key: 'group', label: t('ranking', 'groupTab') },
              { key: 'matches', label: t('ranking', 'matchesTab') },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: activeTab === tab.key ? V('--th-primary') : 'transparent',
                  color: activeTab === tab.key ? '#FFFFFF' : V('--th-text-sub'),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Match Result Banner */}
        {matchResult && activeTab === 'group' && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ borderRadius: '12px', padding: '14px', backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)` }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-primary'), marginBottom: '10px' }}>🎮 {t('ranking', 'matchResult')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchResult.map((r) => {
                  const isPos = r.ratingChange > 0;
                  return (
                    <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', backgroundColor: V('--th-bg') }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: V('--th-text') }}>{r.nickname}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: isPos ? '#16a34a' : '#dc2626' }}>
                        {isPos ? '+' : ''}{Math.round(r.ratingChange)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '0 16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: V('--th-text-sub') }}>{t('common', 'loading')}</p>
            </div>
          ) : activeTab === 'matches' ? (
            matches.length === 0 ? (
              <div style={{ borderRadius: '16px', padding: '40px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
                <p style={{ color: V('--th-text') }}>{t('ranking', 'noMatches')}</p>
                <p style={{ fontSize: '13px', marginTop: '8px', color: V('--th-text-sub') }}>{t('ranking', 'noMatchesDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {matches.map((match) => (
                  <MatchCard
                    key={match.matchId}
                    match={match}
                    isHost={isHost}
                    onEdit={handleEditMatch}
                    onDelete={handleDeleteMatch}
                    onView={handleViewMatch}
                    onShare={handleShareMatch}
                  />
                ))}
              </div>
            )
          ) : rankings.length === 0 ? (
            <div style={{ borderRadius: '16px', padding: '40px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
              <p style={{ fontSize: '17px', color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {pagedRankings.map((rank, idx) => {
                  const index = page * PAGE_SIZE + idx;
                  const isMe = rank.nickname === myNickname;
                  const rankNum = index + 1;

                  return (
                    <RankingRow
                      key={rank.memberId}
                      rank={rank}
                      rankNum={rankNum}
                      isMe={isMe}
                      isHost={isHost}
                      isTopThree={page === 0 && rankNum <= 3}
                      onEdit={handleOpenRatingEdit}
                    />
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      backgroundColor: V('--th-card'), color: page === 0 ? V('--th-text-sub') : V('--th-text'),
                      border: `1px solid var(--th-border)`, cursor: page === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />
                    PREVIOUS
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      backgroundColor: V('--th-card'), color: page >= totalPages - 1 ? V('--th-text-sub') : V('--th-text'),
                      border: `1px solid var(--th-border)`, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    NEXT
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Buttons */}
        <div style={{ padding: '8px 16px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => navigate(`/invite/${roomId}`)}
            style={{ width: '100%', padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', backgroundColor: 'transparent', color: V('--th-primary'), border: `2px solid var(--th-primary)`, cursor: 'pointer' }}
          >
            {t('ranking', 'groupLobby')}
          </button>
          <button
            onClick={() => navigate(`/games/${roomId}`)}
            style={{ width: '100%', padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
          >
            {t('ranking', 'startGame')}
          </button>
        </div>
      </div>

      {/* Rating Edit Modal */}
      {ratingEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ borderRadius: '16px', padding: '24px', margin: '0 16px', width: '100%', maxWidth: '320px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text'), marginBottom: '4px' }}>{t('ranking', 'editRating')}</h3>
            <p style={{ fontSize: '13px', color: V('--th-primary'), marginBottom: '4px' }}>{ratingEditModal.nickname}</p>
            <p style={{ fontSize: '12px', color: V('--th-text-sub'), marginBottom: '16px' }}>{t('ranking', 'editRatingDesc')}</p>
            <input
              type="number"
              value={ratingEditValue}
              onChange={(e) => setRatingEditValue(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', textAlign: 'center',
                fontSize: '18px', fontWeight: '700', outline: 'none', marginBottom: '16px',
                backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`, color: V('--th-text'),
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRatingEditModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '24px', fontSize: '13px', fontWeight: '700', backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}>
                {t('common', 'cancel')}
              </button>
              <button onClick={handleUpdateRating} disabled={isRatingEditSaving} style={{ flex: 1, padding: '10px', borderRadius: '24px', fontSize: '13px', fontWeight: '700', backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: isRatingEditSaving ? 0.5 : 1 }}>
                {isRatingEditSaving ? t('ranking', 'saving') : t('ranking', 'save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;
