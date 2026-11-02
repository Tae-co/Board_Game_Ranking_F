import { useEffect, useState } from 'react';
import { D } from './deviceTheme';

const fitScale = (width, height) => Math.min(window.innerWidth / width, window.innerHeight / height);

/**
 * 시안 크기(TV 1920×1080, 태블릿 1180×820) 그대로 그린 화면을 기기 화면에 맞게 줄이고 늘린다.
 * 남는 쪽은 같은 배경색으로 채워 가운데 둔다.
 */
const DeviceStage = ({ width, height, children }) => {
  const [scale, setScale] = useState(() => fitScale(width, height));

  useEffect(() => {
    const onResize = () => setScale(fitScale(width, height));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width, height]);

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden', backgroundColor: D.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: width * scale, height: height * scale, flexShrink: 0 }}>
        <div style={{
          width, height, transform: `scale(${scale})`, transformOrigin: 'top left',
          boxSizing: 'border-box', backgroundColor: D.bg, color: D.text, overflow: 'hidden',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DeviceStage;
