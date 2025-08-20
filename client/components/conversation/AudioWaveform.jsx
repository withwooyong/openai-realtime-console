import { useState, useEffect } from "react";

export default function AudioWaveform({ isUser, audioData }) {
  const [waveformBars, setWaveformBars] = useState([]);

  // 웨이브폼 생성 (실제로는 오디오 데이터에서 추출해야 함)
  useEffect(() => {
    const generateWaveform = () => {
      const bars = [];
      const barCount = 30;

      for (let i = 0; i < barCount; i++) {
        // 실제로는 audioData에서 FFT 데이터를 추출해야 함
        const height = Math.random() * 20 + 5;
        bars.push(height);
      }

      return bars;
    };

    setWaveformBars(generateWaveform());
  }, [audioData]);

  return (
    <div className="flex items-center gap-1 h-8 px-2">
      {waveformBars.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-300 ${
            isUser ? "bg-green-600" : "bg-purple-600"
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
