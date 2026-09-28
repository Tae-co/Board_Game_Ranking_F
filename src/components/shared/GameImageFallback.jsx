/**
 * 방·게임 이미지가 없을 때 대신 보여주는 앱 로고.
 * 예전엔 🎲 이모지였는데 기기 폰트에 따라 ? 상자로 깨져서 이미지로 바꿨다.
 */
const GameImageFallback = ({ size }) => (
  <img src="/logo.png" width={size} height={size} alt="" style={{ objectFit: 'contain', display: 'block' }} />
);

export default GameImageFallback;
