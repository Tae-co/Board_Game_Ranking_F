import { memo, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const REGION_TIMEZONE = {
  'South Korea': 'Asia/Seoul',
  'United States': 'America/New_York',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'United Kingdom': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'Singapore': 'Asia/Singapore',
  'Hong Kong': 'Asia/Hong_Kong',
  'Taiwan': 'Asia/Taipei',
  'Thailand': 'Asia/Bangkok',
  'Vietnam': 'Asia/Ho_Chi_Minh',
  'Indonesia': 'Asia/Jakarta',
  'Philippines': 'Asia/Manila',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'India': 'Asia/Kolkata',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
  'Netherlands': 'Europe/Amsterdam',
  'Sweden': 'Europe/Stockholm',
  'Norway': 'Europe/Oslo',
  'Denmark': 'Europe/Copenhagen',
  'Finland': 'Europe/Helsinki',
  'Spain': 'Europe/Madrid',
  'Italy': 'Europe/Rome',
  'Poland': 'Europe/Warsaw',
  'Russia': 'Europe/Moscow',
};

const formatDate = (dateStr, timezone) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(dateStr));
};

const formatTime = (dateStr, timezone) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(dateStr));
};

const ordinalSuffix = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const MedalBadge = ({ place, size = 22 }) => {
  const cfg = {
    1: { outer: '#FFD700', inner: '#FFA500', ribbon: '#E69500' },
    2: { outer: '#C8C8D4', inner: '#A0A0B0', ribbon: '#8888A0' },
    3: { outer: '#D4936A', inner: '#B07040', ribbon: '#8A5530' },
  }[place] || {};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="8" fill={cfg.outer} />
      <circle cx="12" cy="13" r="6" fill={cfg.inner} />
      <path d="M12 8l1.18 2.39 2.64.38-1.91 1.86.45 2.63L12 14.01l-2.36 1.25.45-2.63-1.91-1.86 2.64-.38z" fill="#fff" />
      <path d="M9 4h6l-1 4H10z" fill={cfg.ribbon} />
      <path d="M9 4l-2 4h3l1-4z" fill={cfg.outer} />
      <path d="M15 4l2 4h-3l-1-4z" fill={cfg.outer} />
    </svg>
  );
};

const InitialAvatar = ({ nickname, profileImage, size = 36, color = 'var(--th-primary)', fontSize = 14 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    backgroundColor: color, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize, flexShrink: 0, overflow: 'hidden',
  }}>
    {profileImage
      ? <img src={profileImage} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : (nickname || '?')[0].toUpperCase()
    }
  </div>
);

const buildSavedScores = (participants) => {
  const first = participants.find(p => p.scoresJson);
  if (!first) return null;
  try {
    const sample = JSON.parse(first.scoresJson);
    if (Array.isArray(sample.rounds) || sample.hpMap !== undefined) {
      return { "_data": { "all": first.scoresJson } };
    }
  } catch { return null; }

  const savedScores = {};
  participants.forEach((p) => {
    if (!p.scoresJson) return;
    try {
      const parsed = JSON.parse(p.scoresJson);
      Object.entries(parsed).forEach(([catKey, val]) => {
        if (!savedScores[catKey]) savedScores[catKey] = {};
        savedScores[catKey][p.memberId] = val;
      });
    } catch { /* ignore */ }
  });
  return Object.keys(savedScores).length > 0 ? savedScores : null;
};

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const myUserId = Number(localStorage.getItem('userId'));
  const communityRegion = (() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity'))?.region; } catch { return null; }
  })();
  const communityTimezone = REGION_TIMEZONE[communityRegion] || undefined;

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
    staleTime: 1000 * 60 * 3,
  });

  const { data: allMatches = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/matches`); return res.data || []; },
    staleTime: 1000 * 60 * 1,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const gameInfo = useMemo(
    () => games.find(g => g.id === room?.boardGameId) || null,
    [games, room]
  );

  const myRank = useMemo(() => rankings.find(r => r.memberId === myUserId), [rankings, myUserId]);
  const myWinRate = useMemo(() => {
    if (!myRank || (myRank.winCount + myRank.loseCount) === 0) return 0;
    return Math.round(myRank.winCount / (myRank.winCount + myRank.loseCount) * 100);
  }, [myRank]);

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

  const openScoreSheet = useCallback((match, readOnly = false) => {
    const savedScores = buildSavedScores(match.participants);
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId), gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        savedScores, backTo: `/ranking/${roomId}`,
        backState: { activeTab: 'matches' },
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
  const isLoading = activeTab === 'matches' ? isMatchesLoading : isRankingLoading;

  const podium = useMemo(() => {
    const top = rankings.slice(0, 3);
    // order: 2nd, 1st, 3rd
    return [top[1], top[0], top[2]].filter(Boolean);
  }, [rankings]);

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', backgroundColor: V('--th-bg'), minHeight: '100vh', paddingBottom: 100, fontFamily: "'Pretendard', sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid var(--th-border)` }}>
        <button onClick={() => navigate(`/invite/${roomId}`)} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--th-primary)', flexShrink: 0 }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--th-primary)' }}>My Group</span>
        <NavAvatar />
      </div>

      {/* Room info row */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: V('--th-text') }}>{room?.roomName || ''}</span>
      </div>

      {/* Stats card */}
      <div style={{ margin: '16px 16px 0', padding: '16px', borderRadius: 16, background: V('--th-card'), border: `1px solid var(--th-border)`, display: 'flex', alignItems: 'center', gap: 16 }}>
        {gameInfo?.imageUrl ? (
          <img src={gameInfo.imageUrl} alt={gameInfo.name} style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 14, background: V('--th-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎲</div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: V('--th-text'), marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameInfo?.name || room?.roomName || '—'}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsMatches')}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{myRank ? myRank.winCount + myRank.loseCount : 0}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWins')}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e' }}>{myRank?.winCount ?? 0}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsLosses')}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{myRank?.loseCount ?? 0}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWinRate')}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{myWinRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', borderRadius: 24, padding: 4, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
          {[
            { key: 'group', label: t('ranking', 'groupTab') },
            { key: 'matches', label: t('ranking', 'matchesTab') },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.key ? V('--th-primary') : 'transparent',
                color: activeTab === tab.key ? '#fff' : V('--th-text-sub'),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ borderRadius: 12, padding: 14, backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-primary'), marginBottom: 10 }}>🎮 {t('ranking', 'matchResult')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {matchResult.map((r) => (
                <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: V('--th-bg') }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{r.nickname}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.ratingChange > 0 ? '#16a34a' : '#dc2626' }}>
                    {r.ratingChange > 0 ? '+' : ''}{Math.round(r.ratingChange)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 16px 0' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ color: V('--th-text-sub') }}>{t('common', 'loading')}</p>
          </div>
        ) : activeTab === 'matches' ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>RECENT SESSIONS</div>
            {allMatches.length === 0 ? (
              <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                <p style={{ color: V('--th-text') }}>{t('ranking', 'noMatches')}</p>
                <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noMatchesDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allMatches.map((match) => {
                  const myParticipant = match.participants?.find(p => p.memberId === myUserId);
                  const isVictory = myParticipant?.placement === 1;
                  const ratingChange = myParticipant?.ratingChange ?? 0;
                  const ratingSign = ratingChange >= 0 ? '+' : '';
                  const visibleParticipants = (match.participants || []).slice(0, 3);
                  const extraCount = (match.participants?.length || 0) - 3;
                  const hasScoreData = match.participants?.some(p => p.scoresJson);
                  const resultColor = isVictory ? '#16a34a' : '#dc2626';
                  const resultLabel = isVictory ? 'VICTORY' : `${ordinalSuffix(myParticipant?.placement ?? 0)} PLACE`;
                  return (
                    <div key={match.matchId} style={{ borderRadius: 16, padding: '14px 16px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{formatDate(match.playedAt, communityTimezone)}</div>
                          <div style={{ fontSize: 11, color: V('--th-text-sub'), marginTop: 2 }}>{formatTime(match.playedAt, communityTimezone)} · {match.participants?.length || 0} Players</div>
                        </div>
                        {myParticipant && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: resultColor, lineHeight: 1 }}>
                              {ratingSign}{Math.round(ratingChange)}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: resultColor, marginTop: 2 }}>
                              {resultLabel}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Bottom row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex' }}>
                          {visibleParticipants.map((p, i) => (
                            <div key={p.memberId} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: visibleParticipants.length - i, position: 'relative' }}>
                              <InitialAvatar nickname={p.nickname} profileImage={p.profileImage} size={36} fontSize={14} />
                              {p.placement === 1 && (
                                <div style={{ position: 'absolute', top: -8, left: -2, fontSize: 13, lineHeight: 1 }}>👑</div>
                              )}
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div style={{ marginLeft: -10, width: 36, height: 36, borderRadius: '50%', background: V('--th-border'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), zIndex: 0 }}>
                              +{extraCount}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {hasScoreData && (
                            <button onClick={() => handleViewMatch(match)} style={{ fontSize: 12, fontWeight: 600, color: V('--th-primary'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              Details ›
                            </button>
                          )}
                          {isHost && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {hasScoreData && (
                                <button onClick={() => handleEditMatch(match)} style={{ fontSize: 10, fontWeight: 600, color: V('--th-text-sub'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>
                              )}
                              <button onClick={() => handleDeleteMatch(match.matchId)} style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>삭제</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : rankings.length === 0 ? (
          <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
            <p style={{ fontSize: 17, color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
            <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {rankings.length >= 1 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {/* order: 2nd left, 1st center, 3rd right */}
                {[
                  { rank: rankings[1], place: 2, size: 70, avatarSize: 58, podiumOffset: 0, medalOffset: -6 },
                  { rank: rankings[0], place: 1, size: 90, avatarSize: 82, ring: '#FFD700', podiumOffset: 36, medalOffset: -1 },
                  { rank: rankings[2], place: 3, size: 60, avatarSize: 50, podiumOffset: 0, medalOffset: -4 },
                ].map(({ rank, place, size, avatarSize, ring, podiumOffset, medalOffset }) => {
                  if (!rank) return <div key={place} style={{ flex: 1 }} />;
                  const isMe = rank.memberId === myUserId;
                  return (
                    <div key={rank.memberId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: podiumOffset }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: avatarSize, height: avatarSize, borderRadius: '50%',
                          backgroundColor: V('--th-primary'), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: Math.round(avatarSize * 0.3),
                          border: ring ? `3px solid ${ring}` : 'none',
                          boxSizing: 'border-box', overflow: 'hidden',
                        }}>
                          {rank.profileImage
                            ? <img src={rank.profileImage} alt={rank.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : (rank.nickname || '?')[0].toUpperCase()
                          }
                        </div>
                        <div style={{ position: 'absolute', bottom: medalOffset, right: medalOffset }}>
                          <MedalBadge place={place} size={avatarSize > 56 ? 26 : 22} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: size }}>
                          {rank.nickname}
                        </div>
                        <div style={{ fontSize: 13, color: ring ? '#FFD700' : V('--th-text'), fontWeight: 800 }}>
                          {Math.round(rank.rating).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Column header — always shown when there are rankings */}
            <div style={{
              display: 'flex', padding: '6px 12px', marginBottom: 4, marginTop: 4,
              backgroundColor: V('--th-card'), borderRadius: 8,
              border: '1px solid var(--th-border)',
            }}>
              <div style={{ width: 32, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RANK</div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', paddingLeft: 36 }}>PLAYER</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RATING</div>
            </div>

            {/* 4th+ rows */}
            {rankings.length > 3 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {pagedRankings.filter((_, idx) => page === 0 ? idx >= 3 : true).map((rank, idx) => {
                    const realIdx = page === 0 ? idx + 3 : idx;
                    const rankNum = page * PAGE_SIZE + (page === 0 ? realIdx : idx) + 1;
                    const isMe = rank.memberId === myUserId;
                    return (
                      <div
                        key={rank.memberId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: isMe ? '10px 12px 10px 10px' : '10px 12px',
                          borderRadius: 12,
                          backgroundColor: isMe ? 'color-mix(in srgb, var(--th-primary) 12%, transparent)' : V('--th-card'),
                          border: `1px solid ${isMe ? 'var(--th-primary)' : 'var(--th-border)'}`,
                          borderLeft: isMe ? '4px solid var(--th-primary)' : `1px solid var(--th-border)`,
                          boxShadow: isMe ? '0 2px 12px color-mix(in srgb, var(--th-primary) 20%, transparent)' : 'none',
                        }}
                      >
                        <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: isMe ? 'var(--th-primary)' : V('--th-text-sub'), textAlign: 'center' }}>{rankNum}</div>
                        <InitialAvatar nickname={rank.nickname} profileImage={rank.profileImage} size={28} fontSize={11} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rank.nickname}
                          </div>
                          {isMe && <div style={{ fontSize: 10, color: 'var(--th-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>YOU</div>}
                        </div>
                        {isHost && (
                          <button onClick={() => handleOpenRatingEdit(rank)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                            <Pencil style={{ width: 13, height: 13, color: V('--th-text-sub') }} />
                          </button>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--th-primary)', flexShrink: 0 }}>
                          {Math.round(rank.rating).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        backgroundColor: V('--th-card'), color: page === 0 ? V('--th-text-sub') : V('--th-text'),
                        border: `1px solid var(--th-border)`, cursor: page === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronLeft style={{ width: 14, height: 14 }} />
                      PREVIOUS
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        backgroundColor: V('--th-card'), color: page >= totalPages - 1 ? V('--th-text-sub') : V('--th-text'),
                        border: `1px solid var(--th-border)`, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      NEXT
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '390px', padding: '12px 20px 28px',
        backgroundColor: V('--th-nav-bg'),
      }}>
        <button
          onClick={() => navigate(`/invite/${roomId}`)}
          style={{
            width: '100%', padding: '15px', borderRadius: '50px', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 16px rgba(107, 92, 231, 0.4)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
            {t('ranking', 'startGame')}
          </span>
        </button>
      </div>

      {/* Rating Edit Modal */}
      {ratingEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ borderRadius: 16, padding: 24, margin: '0 16px', width: '100%', maxWidth: 320, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: V('--th-text'), marginBottom: 4 }}>{t('ranking', 'editRating')}</h3>
            <p style={{ fontSize: 13, color: V('--th-primary'), marginBottom: 4 }}>{ratingEditModal.nickname}</p>
            <p style={{ fontSize: 12, color: V('--th-text-sub'), marginBottom: 16 }}>{t('ranking', 'editRatingDesc')}</p>
            <input
              type="number"
              value={ratingEditValue}
              onChange={(e) => setRatingEditValue(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                fontSize: 18, fontWeight: 700, outline: 'none', marginBottom: 16,
                backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`, color: V('--th-text'),
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRatingEditModal(null)} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}>
                {t('common', 'cancel')}
              </button>
              <button onClick={handleUpdateRating} disabled={isRatingEditSaving} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-primary'), color: '#fff', border: 'none', cursor: 'pointer', opacity: isRatingEditSaving ? 0.5 : 1 }}>
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
