import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // 상태 관리: 현재 그룹 랭킹 vs 전체 랭킹 전환
  const [isGlobal, setIsGlobal] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [roomName, setRoomName] = useState('우리 방');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // isGlobal 상태에 따라 백엔드 엔드포인트를 다르게 설정
        const endpoint = isGlobal ? '/rankings/global' : `/rooms/${roomId}/rankings`;
        const res = await api.get(endpoint);
        
        // 백엔드 응답에 맞게 세팅 (예: res.data가 바로 배열인지 확인)
        setRankings(res.data || []); 
      } catch (err) {
        console.error('랭킹 정보를 불러오는데 실패했습니다.', err);
      }
    };

    fetchRankings();
  }, [isGlobal, roomId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full mt-10 space-y-8">
        
        {/* 상단 헤더 및 전환 버튼 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-900">
              {isGlobal ? '전체 랭킹' : '그룹 랭킹'}
            </h1>
            <button 
              onClick={() => navigate(`/invite/${roomId}`)}
              className="text-slate-400 font-bold hover:text-slate-700"
            >
              닫기
            </button>
          </div>

          {/* 랭킹 전환 탭 */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border-2 border-slate-100">
            <button 
              onClick={() => setIsGlobal(false)}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                !isGlobal ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              우리 방 랭킹
            </button>
            <button 
              onClick={() => setIsGlobal(true)}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                isGlobal ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              전체 랭킹 보기
            </button>
          </div>
        </div>

        {/* 랭킹 리스트 영역 */}
        <div className="space-y-3">
          {rankings.map((rank, index) => {
            const isTop3 = index < 3;
            const rankColors = ['bg-amber-400', 'bg-slate-300', 'bg-orange-400']; // 금, 은, 동

            return (
              <div 
                key={rank.memberId}
                className={`bg-white p-5 rounded-3xl shadow-sm flex items-center gap-4 border-2 transition-all ${
                  rank.nickname === '태코' ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                }`}
              >
                {/* 순위 표시 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${
                  isTop3 ? rankColors[index] : 'bg-slate-200 text-slate-500'
                }`}>
                  {index + 1}
                </div>

                {/* 유저 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-800">{rank.nickname}</span>
                    {rank.nickname === '태코' && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black">MY</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-bold">
                    {rank.winCount}승 {rank.loseCount}패 (승률 {Math.round((rank.winCount / (rank.winCount + rank.loseCount)) * 100)}%)
                  </p>
                </div>

                {/* 점수 표시 */}
                <div className="text-right">
                  <span className="block font-black text-xl text-slate-900">{rank.score.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Points</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 홈으로 가기 버튼 */}
        <div className="pt-6">
          <button 
            onClick={() => navigate('/lobby')} // 대기실로 이동
            className="w-full py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-300 transition-all"
          >
            대기실로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ranking;