import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TierBadge, TIERS } from '../components/TierBadge';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const getRankStyle = (index) => {
  if (index === 0) return { color: '#FFD700', bgColor: '#FFD700' };
  if (index === 1) return { color: '#C0C0C0', bgColor: '#C0C0C0' };
  if (index === 2) return { color: '#CD7F32', bgColor: '#CD7F32' };
  return { color: 'var(--th-text-sub)', bgColor: 'var(--th-border)' };
};

const RankBadge = ({ index }) => {
  const rankStyle = getRankStyle(index);
  return (
    <motion.div
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold relative flex-shrink-0"
      style={{
        background: index < 3
          ? `linear-gradient(135deg, ${rankStyle.bgColor}, ${rankStyle.color}80)`
          : 'var(--th-border)',
        color: index < 3 ? '#FFFFFF' : 'var(--th-text)',
        boxShadow: index < 3 ? `0 4px 12px ${rankStyle.color}60` : 'none',
        fontSize: '13px',
      }}
      animate={index < 3 ? {
        boxShadow: [
          `0 4px 12px ${rankStyle.color}60`,
          `0 6px 20px ${rankStyle.color}80`,
          `0 4px 12px ${rankStyle.color}60`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {index + 1}
      {index === 0 && (
        <div className="absolute -top-1 -right-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' }}>
          <Crown className="w-3 h-3" style={{ color: '#FFD700', fill: '#FFD700' }} />
        </div>
      )}
    </motion.div>
  );
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState('group');
  const [showChanges, setShowChanges] = useState(!!matchResult);
  const [ratingEditModal, setRatingEditModal] = useState(null); // { memberId, nickname, currentRating }
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const myNickname = localStorage.getItem('nickname');
  const myUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    if (!matchResult) return;
    const timer = setTimeout(() => setShowChanges(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  const ratingChangeMap = matchResult
    ? Object.fromEntries(matchResult.map(r => [r.memberId, r.ratingChange]))
    : {};

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: roomMembers = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const isHost = roomMembers.find(m => m.memberId === myUserId)?.isHost ?? false;

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/rankings`);
      return res.data || [];
    },
    enabled: activeTab === 'group',
    staleTime: 1000 * 60 * 3,
  });

  const { data: matches = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/matches`);
      return res.data || [];
    },
    enabled: activeTab === 'matches',
    staleTime: 1000 * 60 * 1,
  });

  const getWinRate = (winCount, loseCount) => {
    const total = winCount + loseCount;
    if (total === 0) return 0;
    return Math.round((winCount / total) * 100);
  };

  const getTier = (points) => {
    if (points >= TIERS.diamond.minPoints) return TIERS.diamond;
    if (points >= TIERS.platinum.minPoints) return TIERS.platinum;
    if (points >= TIERS.gold.minPoints) return TIERS.gold;
    if (points >= TIERS.silver.minPoints) return TIERS.silver;
    return TIERS.bronze;
  };

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await api.put(`/rooms/${roomId}/members/${ratingEditModal.memberId}/rating`, {
        requesterId: myUserId,
        rating: val,
      });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      setRatingEditModal(null);
    } catch {
      alert(t('ranking', 'editRatingFailed'));
    } finally {
      setIsRatingEditSaving(false);
    }
  };

  const shareText = (text) => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  const handleShareRanking = () => {
    const roomName = room?.roomName ?? '';
    const lines = rankings.slice(0, 5).map((r, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}위`;
      const rate = r.winCount + r.loseCount > 0
        ? Math.round(r.winCount / (r.winCount + r.loseCount) * 100)
        : 0;
      return `${medal} ${r.nickname}  ${Math.round(r.rating)}LP  W${r.winCount} L${r.loseCount}  ${rate}%`;
    });
    shareText(`🏆 ${roomName} 그룹 랭킹\n\n${lines.join('\n')}\n\n🎲 boardup.pages.dev`);
  };

  const handleShareMatch = (match) => {
    const lines = [...match.participants]
      .sort((a, b) => a.placement - b.placement)
      .map((p, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}위`;
        const sign = p.ratingChange >= 0 ? '+' : '';
        return `${medal} ${p.nickname}  ${sign}${Math.round(p.ratingChange)}LP`;
      });
    shareText(`🎮 오늘의 매치 결과 - ${match.gameName}\n\n${lines.join('\n')}`);
  };

  const handleEditMatch = (match) => {
    const savedScores = {};
    match.participants.forEach(p => {
      if (!p.scoresJson) return;
      try {
        const parsed = JSON.parse(p.scoresJson);
        Object.entries(parsed).forEach(([catKey, val]) => {
          if (!savedScores[catKey]) savedScores[catKey] = {};
          savedScores[catKey][p.memberId] = val;
        });
      } catch {}
    });
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId),
        gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        editMatchId: match.matchId,
        savedScores: Object.keys(savedScores).length > 0 ? savedScores : null,
      },
    });
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/matches/${matchId}?requesterId=${myUserId}`);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const isLoading = activeTab === 'matches' ? isMatchesLoading : isRankingLoading;

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center sticky top-0 z-10" style={{ backgroundColor: 'var(--th-bg)' }}>
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--th-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Trophy className="w-6 h-6 mr-2" style={{ color: 'var(--th-primary)' }} />
        <h1 className="text-xl flex-1" style={{ color: 'var(--th-text)' }}>{t('ranking', 'title')}</h1>
        <button onClick={handleShareRanking} className="p-2 rounded-lg" style={{ color: 'var(--th-primary)' }}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="px-6 mb-4">
        <div className="flex rounded-full p-1" style={{ backgroundColor: 'var(--th-card)', border: '1px solid var(--th-border)' }}>
          {[
            { key: 'group', label: t('ranking', 'groupTab') },
            { key: 'matches', label: t('ranking', 'matchesTab') },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-full transition-all text-xs"
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--th-primary)' : 'transparent',
                color: activeTab === tab.key ? '#FFFFFF' : 'var(--th-text-sub)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div className="px-6 mb-4">
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-primary)' }}>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--th-primary)' }}>🎮 {t('ranking', 'matchResult')}</p>
            <div className="flex flex-wrap gap-2">
              {matchResult.map((r) => {
                const change = r.ratingChange;
                const isPos = change > 0;
                return (
                  <div
                    key={r.memberId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--th-bg)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--th-text)' }}>{r.nickname}</span>
                    <span className="text-sm font-bold" style={{ color: isPos ? '#16a34a' : '#dc2626' }}>
                      {isPos ? '+' : ''}{Math.round(change)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⏳</div>
            <p style={{ color: 'var(--th-text-sub)' }}>{t('common', 'loading')}</p>
          </div>
        ) : activeTab === 'matches' ? (
          matches.length === 0 ? (
            <div className="rounded-2xl p-10 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
              <div className="text-5xl mb-4">🎲</div>
              <p style={{ color: 'var(--th-text)' }}>{t('ranking', 'noMatches')}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--th-text-sub)' }}>{t('ranking', 'noMatchesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--th-text-sub)' }}>{match.gameName}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--th-text)' }}>{formatDate(match.playedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      {isHost && (
                        <>
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="px-3 py-1 rounded-full text-xs"
                            style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-primary)', border: '1px solid var(--th-primary)' }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match.matchId)}
                            className="px-3 py-1 rounded-full text-xs"
                            style={{ backgroundColor: 'var(--th-bg)', color: '#dc2626', border: '1px solid #dc2626' }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleShareMatch(match)}
                        className="p-1 rounded-full"
                        style={{ color: 'var(--th-text-sub)' }}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {match.participants.map((p) => (
                      <div key={p.memberId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor: p.placement === 1 ? '#FFD700' : p.placement === 2 ? '#C0C0C0' : p.placement === 3 ? '#CD7F32' : 'var(--th-border)',
                              color: '#FFFFFF',
                            }}
                          >
                            {p.placement}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--th-text)' }}>{p.nickname}</span>
                        </div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: p.ratingChange > 0 ? '#16a34a' : '#dc2626' }}
                        >
                          {p.ratingChange > 0 ? '+' : ''}{Math.round(p.ratingChange)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : rankings.length === 0 ? (
          <div className="rounded-2xl p-10 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-lg" style={{ color: 'var(--th-text)' }}>{t('ranking', 'noRecord')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--th-text-sub)' }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((rank, index) => {
              const isMe = rank.nickname === myNickname;
              const tier = getTier(Math.round(rank.rating));
              const change = ratingChangeMap[rank.memberId];
              const winRate = getWinRate(rank.winCount, rank.loseCount);

              return (
                <motion.div
                  key={rank.memberId}
                  className="rounded-xl px-3 py-2.5 border flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--th-card)',
                    borderColor: isMe ? 'var(--th-primary)' : 'var(--th-border)',
                    borderWidth: isMe ? '2px' : '1px',
                    boxShadow: isMe ? '0 4px 12px rgba(var(--th-primary-rgb), 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  {/* 순위 뱃지 */}
                  <RankBadge index={index} />

                  {/* 티어 뱃지 */}
                  <TierBadge tier={tier} size="sm" />

                  {/* 닉네임 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--th-text)' }}>{rank.nickname}</p>
                      {isMe && (
                        <motion.span
                          className="px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--th-primary), var(--th-primary-light))', color: '#FFFFFF', fontSize: '10px' }}
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ME
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* W / L / WR */}
                  <div className="flex items-center gap-1 flex-shrink-0 self-center" style={{ color: 'var(--th-text-sub)', fontSize: '10px' }}>
                    <span>W<span className="font-bold ml-0.5" style={{ color: 'var(--th-text)' }}>{rank.winCount}</span></span>
                    <span>L<span className="font-bold ml-0.5" style={{ color: 'var(--th-text)' }}>{rank.loseCount}</span></span>
                    <span>WR<span className="font-bold ml-0.5" style={{ color: winRate >= 60 ? 'var(--th-primary)' : 'var(--th-text)' }}>{winRate}%</span></span>
                  </div>

                  {/* 편집 버튼 (방장만) */}
                  {isHost && (
                    <div className="relative flex-shrink-0">
                      {rank.playCount === 0 ? (
                        <button
                          onClick={() => { setRatingEditModal({ memberId: rank.memberId, nickname: rank.nickname, currentRating: rank.rating }); setRatingEditValue(String(Math.round(rank.rating))); }}
                          className="text-xs px-1 py-0.5 rounded"
                          style={{ color: 'var(--th-primary)', cursor: 'pointer', fontSize: '14px' }}
                          title={t('ranking', 'editRating')}
                        >
                          ✏️
                        </button>
                      ) : (
                        <span
                          className="text-xs px-1 py-0.5 rounded"
                          style={{ color: 'var(--th-text-sub)', cursor: 'not-allowed', fontSize: '14px', opacity: 0.4 }}
                          title={t('ranking', 'hasMatchRecord')}
                        >
                          ✏️
                        </span>
                      )}
                    </div>
                  )}

                  {/* 점수 */}
                  <div className="flex-shrink-0 relative text-right" style={{ minWidth: '36px' }}>
                    <p
                      className="text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--th-primary), var(--th-primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}
                    >
                      {Math.round(rank.rating)}
                    </p>
                    {showChanges && change !== undefined && (
                      <p className="font-bold" style={{ color: change > 0 ? '#16a34a' : '#dc2626', fontSize: '10px', lineHeight: 1.2 }}>
                        {change > 0 ? '+' : ''}{Math.round(change)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 mt-4 space-y-2">
        <motion.button
          onClick={() => navigate(`/invite/${roomId}`)}
          className="w-full py-2 rounded-full text-sm font-bold border-2"
          style={{ backgroundColor: 'transparent', color: 'var(--th-primary)', borderColor: 'var(--th-primary)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          게임 로비
        </motion.button>
        <motion.button
          onClick={() => navigate(`/games/${roomId}`)}
          className="w-full py-2 rounded-full text-sm font-bold"
          style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(var(--th-primary-rgb), 0.3)' }}
          whileTap={{ scale: 0.98 }}
        >
          게임 시작
        </motion.button>
      </div>

      {/* LP 수정 모달 */}
      {ratingEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="rounded-2xl p-6 mx-4 w-full" style={{ maxWidth: '320px', backgroundColor: 'var(--th-card)', border: '1px solid var(--th-border)' }}>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--th-text)' }}>{t('ranking', 'editRating')}</h3>
            <p className="text-sm mb-1" style={{ color: 'var(--th-primary)' }}>{ratingEditModal.nickname}</p>
            <p className="text-xs mb-4" style={{ color: 'var(--th-text-sub)' }}>{t('ranking', 'editRatingDesc')}</p>
            <input
              type="number"
              value={ratingEditValue}
              onChange={(e) => setRatingEditValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-center text-lg font-bold focus:outline-none mb-4"
              style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRatingEditModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-text-sub)', border: '1px solid var(--th-border)' }}
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={handleUpdateRating}
                disabled={isRatingEditSaving}
                className="flex-1 py-2.5 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
              >
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
