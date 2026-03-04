
import { useState } from 'react';
import api from '../api/axios';

const MatchForm = ({ onMatchSubmitted }) => {
  // 테스트를 위해 고정된 유저 리스트 (나중에 API로 가져오게 바꿀 수 있습니다)
  const players = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'David' }
  ];

  const [results, setResults] = useState(
    players.map(p => ({ memberId: p.id, placement: 1, name: p.name }))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        boardGameId: 1, // 카탄
        participants: results.map(({ memberId, placement }) => ({ memberId, placement: Number(placement) }))
      };
      const res = await api.post('/matches', payload);
      alert('매치 결과가 저장되었습니다!');
      onMatchSubmitted(res.data); // 상위 컴포넌트의 랭킹을 새로고침
    } catch (err) {
      alert('저장 실패: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-inner border border-gray-100 mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🎮 매치 결과 기록</h2>
      <div className="space-y-3">
        {results.map((res, idx) => (
          <div key={res.memberId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="font-medium">{res.name}</span>
            <select 
              className="border rounded px-2 py-1 bg-white"
              value={res.placement}
              onChange={(e) => {
                const newResults = [...results];
                newResults[idx].placement = e.target.value;
                setResults(newResults);
              }}
            >
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}등</option>)}
            </select>
          </div>
        ))}
      </div>
      <button type="submit" className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
        결과 제출하기
      </button>
    </form>
  );
};

export default MatchForm;