import { useState, useEffect } from "react";

// 임시로 아이콘을 대체할 간단한 컴포넌트들
const Mic = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    🎤
  </div>
);

const MicOff = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    🔇
  </div>
);

export default function AudioBufferPanel({
  events,
  isSessionActive,
  dataChannel,
}) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // 오디오 레벨 시뮬레이션 (실제로는 WebRTC에서 가져와야 함)
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      if (isRecording) {
        setAudioLevel(Math.random() * 100);
      } else {
        setAudioLevel(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSessionActive, isRecording]);

  // 이벤트에서 오디오 상태 추적
  useEffect(() => {
    if (!events) return;

    const recentEvents = events.slice(0, 5);
    for (const event of recentEvents) {
      if (event.type === "input_audio_buffer.speech_started") {
        setIsRecording(true);
      } else if (event.type === "input_audio_buffer.speech_stopped") {
        setIsRecording(false);
      }
    }
  }, [events]);

  // 오디오 레벨 바 생성
  const createAudioBars = () => {
    const bars = [];
    const barCount = 20;

    for (let i = 0; i < barCount; i++) {
      const height = isRecording
        ? Math.random() * (audioLevel / 2) + 10
        : Math.random() * 5 + 2;

      bars.push(
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-75 ${
            isRecording
              ? height > 30
                ? "bg-green-500"
                : "bg-green-300"
              : "bg-gray-300"
          }`}
          style={{ height: `${Math.min(height, 60)}px` }}
        />,
      );
    }
    return bars;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">
          Input Audio Buffer
        </h3>
      </div>

      {/* 오디오 시각화 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        {isSessionActive ? (
          <>
            {/* 마이크 아이콘 */}
            <div
              className={`mb-6 p-4 rounded-full ${
                isRecording
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isRecording ? (
                <Mic size={32} className="animate-pulse" />
              ) : (
                <MicOff size={32} />
              )}
            </div>

            {/* 오디오 레벨 바들 */}
            <div className="flex items-end justify-center gap-1 h-16 mb-4">
              {createAudioBars()}
            </div>

            {/* 상태 텍스트 */}
            <div className="text-center">
              <p
                className={`text-sm font-medium ${
                  isRecording ? "text-red-600" : "text-gray-500"
                }`}
              >
                {isRecording ? "Recording..." : "Listening"}
              </p>
              {audioLevel > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Level: {Math.round(audioLevel)}%
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <MicOff size={48} className="mx-auto mb-4 opacity-50" />
            <p>Session not active</p>
          </div>
        )}
      </div>
    </div>
  );
}
