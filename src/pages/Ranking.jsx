import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { TierBadge, TIERS } from '../components/TierBadge';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const getRankStyle = (index) => {
  if (index === 0) return { color: '#FFD700', bgColor: '#FFD700' };
  if (index === 1) return { color: '#C0C0C0', bgColor: '#C0C0C0' };
  if (index === 2) return { color: '#CD7F32', bgColor: '#CD7F32' };
  return { color: '#8B7355', bgColor: '#E5D5C0' };
};

const RankBadge = ({ index }) => {
  const rankStyle = getRankStyle(index);
  return (
    <motion.div
      className="w-12 h-12 rounded-full flex items-center justify-center font-bold relative flex-shrink-0"
      style={{
        background: index < 3
          ? `linear-gradient(135deg, ${rankStyle.bgColor}, ${rankStyle.color}80)`
          : '#E5D5C0',
        color: index < 3 ? '#FFFFFF' : '#2C1F0E',
        boxShadow: index < 3 ? `0 4px 12px ${rankStyle.color}60, 0 0 20px ${rankStyle.color}40` : 'none',
        fontSize: '16px',
      }}
      animate={index < 3 ? {
        boxShadow: [
          `0 4px 12px ${rankStyle.color}60, 0 0 20px ${rankStyle.color}40`,
          `0 6px 20px ${rankStyle.color}80, 0 0 30px ${rankStyle.color}60`,
          `0 4px 12px ${rankStyle.color}60, 0 0 20px ${rankStyle.color}40`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {index + 1}
      {index === 0 && (
        <div className="absolute -top-1 -right-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' }}>
          <Crown className="w-4 h-4" style={{ color: '#FFD700', fill: '#FFD700' }} />
        </div>
      )}
    </motion.div>
  );
};

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState('group');
  const myNickname = localStorage.getItem('nickname');

  const ratingChangeMap = matchResult
    ? Object.fromEntries(matchResult.map(r => [r.memberId, r.ratingChange]))
    : {};

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['rankings', roomId, activeTab],
    queryFn: async () => {
      const endpoint = activeTab === 'global'
        ? '/rankings/global'
        : `/rooms/${roomId}/rankings?boardGameId=1`;
      const res = await api.get(endpoint);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 3,
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

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center sticky top-0 z-10" style={{ backgroundColor: '#FFF8F0' }}>
        <button
          onClick={() => navigate(`/invite/${roomId}`)}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: '#D4853A' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Trophy className="w-6 h-6 mr-2" style={{ color: '#D4853A' }} />
        <h1 className="text-xl" style={{ color: '#2C1F0E' }}>{t('ranking', 'title')}</h1>
      </div>

      {/* Tab Toggle */}
      <div className="px-6 mb-4">
        <div className="flex rounded-full p-1" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5D5C0' }}>
          <button
            onClick={() => setActiveTab('group')}
            className="flex-1 py-2 rounded-full transition-all"
            style={{
              backgroundColor: activeTab === 'group' ? '#D4853A' : 'transparent',
              color: activeTab === 'group' ? '#FFFFFF' : '#8B7355',
            }}
          >
            {t('ranking', 'groupTab')}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className="flex-1 py-2 rounded-full transition-all"
            style={{
              backgroundColor: activeTab === 'global' ? '#D4853A' : 'transparent',
              color: activeTab === 'global' ? '#FFFFFF' : '#8B7355',
            }}
          >
            {t('ranking', 'globalTab')}
          </button>
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div className="px-6 mb-4">
          <div className="rounded-xl p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#D4853A' }}>
            <p className="text-xs font-bold mb-3" style={{ color: '#D4853A' }}>🎮 {t('ranking', 'matchResult')}</p>
            <div className="flex flex-wrap gap-2">
              {matchResult.map((r) => {
                const change = r.ratingChange;
                const isPos = change > 0;
                return (
                  <div
                    key={r.memberId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: '#FFF8F0' }}
                  >
                    <span className="text-sm font-bold" style={{ color: '#2C1F0E' }}>{r.nickname}</span>
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

      {/* Ranking List */}
      <div className="px-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⏳</div>
            <p style={{ color: '#8B7355' }}>{t('common', 'loading')}</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="rounded-2xl p-10 border-2 border-dashed text-center" style={{ borderColor: '#E5D5C0' }}>
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-lg" style={{ color: '#2C1F0E' }}>{t('ranking', 'noRecord')}</p>
            <p className="text-sm mt-2" style={{ color: '#8B7355' }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : activeTab === 'group' ? (
          <div className="space-y-3">
            {rankings.map((rank, index) => {
              const isMe = rank.nickname === myNickname;
              const tier = getTier(Math.round(rank.rating));
              const change = ratingChangeMap[rank.memberId];
              const winRate = getWinRate(rank.winCount, rank.loseCount);

              return (
                <motion.div
                  key={rank.memberId}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: isMe ? '#D4853A' : '#E5D5C0',
                    borderWidth: isMe ? '2px' : '1px',
                    boxShadow: isMe ? '0 4px 12px rgba(212, 133, 58, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RankBadge index={index} />
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #D4853A, #B86F2E)', color: '#FFFFFF', boxShadow: '0 4px 8px rgba(212, 133, 58, 0.3)' }}
                    >
                      {rank.nickname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate" style={{ color: '#2C1F0E' }}>{rank.nickname}</p>
                        {isMe && (
                          <motion.span
                            className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #D4853A, #E89A4F)', color: '#FFFFFF' }}
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            MY
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TierBadge tier={tier} size="sm" />
                        <span className="text-xs font-semibold" style={{ color: tier.color }}>{tier.name}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <motion.p
                          className="text-2xl font-bold"
                          style={{ background: 'linear-gradient(135deg, #D4853A, #E89A4F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {Math.round(rank.rating)}
                        </motion.p>
                        {change !== undefined && (
                          <span className="text-xs font-bold" style={{ color: change > 0 ? '#16a34a' : '#dc2626' }}>
                            {change > 0 ? '+' : ''}{Math.round(change)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#8B7355' }}>LP</p>
                    </div>
                  </div>
                  <div className="flex pt-3" style={{ borderTop: '1px solid #E5D5C0' }}>
                    <div className="flex-1 text-center">
                      <p className="text-xs mb-0.5" style={{ color: '#8B7355' }}>{t('ranking', 'wins')}</p>
                      <p className="text-sm font-bold" style={{ color: '#2C1F0E' }}>{rank.winCount}</p>
                    </div>
                    <div className="flex-1 text-center" style={{ borderLeft: '1px solid #E5D5C0', borderRight: '1px solid #E5D5C0' }}>
                      <p className="text-xs mb-0.5" style={{ color: '#8B7355' }}>{t('ranking', 'losses')}</p>
                      <p className="text-sm font-bold" style={{ color: '#2C1F0E' }}>{rank.loseCount}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs mb-0.5" style={{ color: '#8B7355' }}>{t('ranking', 'winRate')}</p>
                      <p className="text-sm font-bold" style={{ color: winRate >= 60 ? '#D4853A' : winRate >= 50 ? '#8B7355' : '#999' }}>{winRate}%</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((rank, index) => {
              const isMe = rank.nickname === myNickname;
              const tier = getTier(Math.round(rank.rating));

              return (
                <motion.div
                  key={rank.memberId}
                  className="rounded-xl p-4 border flex items-center gap-3"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: isMe ? '#D4853A' : '#E5D5C0',
                    borderWidth: isMe ? '2px' : '1px',
                    boxShadow: isMe ? '0 4px 12px rgba(212, 133, 58, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transition: { duration: 0.2 } }}
                >
                  <RankBadge index={index} />
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4853A, #B86F2E)', color: '#FFFFFF', boxShadow: '0 4px 8px rgba(212, 133, 58, 0.3)' }}
                  >
                    {rank.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate" style={{ color: '#2C1F0E' }}>{rank.nickname}</p>
                      {isMe && (
                        <motion.span
                          className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #D4853A, #E89A4F)', color: '#FFFFFF' }}
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          MY
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={tier} size="sm" />
                      <span className="text-xs font-semibold" style={{ color: tier.color }}>{tier.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <motion.p
                      className="text-2xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #D4853A, #E89A4F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {Math.round(rank.rating)}
                    </motion.p>
                    <p className="text-xs" style={{ color: '#8B7355' }}>LP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tier Legend */}
      <div className="px-6 mt-8">
        <motion.div
          className="rounded-xl p-5 border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: '#2C1F0E' }}>{t('ranking', 'tierSystem')}</h3>
          <div className="space-y-4">
            {Object.values(TIERS).reverse().map((tier, index) => (
              <motion.div
                key={tier.name}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <TierBadge tier={tier} size="md" />
                <div>
                  <p className="font-bold" style={{ color: tier.color }}>{tier.name}</p>
                  <p className="text-xs" style={{ color: '#8B7355' }}>
                    {tier.minPoints} ~ {tier.maxPoints === 9999 ? '∞' : tier.maxPoints} LP
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Back to Lobby */}
      <div className="px-6 mt-6">
        <motion.button
          onClick={() => navigate('/lobby')}
          className="w-full py-4 rounded-full border-2 font-bold"
          style={{ backgroundColor: '#FFFFFF', color: '#D4853A', borderColor: '#D4853A' }}
          whileHover={{ scale: 1.02, backgroundColor: '#D4853A', color: '#FFFFFF', boxShadow: '0 8px 16px rgba(212, 133, 58, 0.3)' }}
          whileTap={{ scale: 0.98 }}
        >
          {t('ranking', 'backToLobby')}
        </motion.button>
      </div>
    </div>
  );
};

export default Ranking;
