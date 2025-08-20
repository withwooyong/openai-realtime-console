import { useState, useEffect } from "react";

// 임시로 아이콘을 대체할 간단한 컴포넌트들
const CheckCircle = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    ✅
  </div>
);

const Clock = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    ⏰
  </div>
);

const AlertCircle = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    ⚠️
  </div>
);

export default function ResponsePanel({ events, isSessionActive }) {
  const [responses, setResponses] = useState([]);

  // 이벤트에서 응답 상태 추출
  useEffect(() => {
    if (!events || events.length === 0) return;

    const responseStates = [];

    events.forEach((event) => {
      // 응답 생성 중
      if (event.type === "response.created") {
        responseStates.push({
          id: event.event_id || event.response?.id,
          status: "in_progress",
          type: "Response",
          timestamp: event.timestamp || new Date().toLocaleTimeString(),
          details: ["audio", "audio_transcript"],
        });
      }

      // 응답 완료
      if (event.type === "response.done") {
        responseStates.push({
          id: event.event_id || event.response?.id,
          status: "done",
          type: "Response",
          timestamp: event.timestamp || new Date().toLocaleTimeString(),
          details: event.response?.output?.map((output) => output.type) || [],
        });
      }

      // 오디오 응답 델타
      if (event.type === "response.audio.delta") {
        responseStates.push({
          id: event.event_id,
          status: "in_progress",
          type: "Audio Delta",
          timestamp: event.timestamp || new Date().toLocaleTimeString(),
          details: ["streaming"],
        });
      }
    });

    // 최신 상태만 유지 (최대 10개)
    const uniqueResponses = responseStates.reverse().slice(0, 10);

    setResponses(uniqueResponses);
  }, [events]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircle size={16} className="text-green-500" />;
      case "in_progress":
        return <Clock size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-50 border-green-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">
          Responses
        </h3>
      </div>

      {/* 응답 목록 */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
        {isSessionActive ? (
          responses.length > 0 ? (
            responses.map((response, index) => (
              <div
                key={response.id || index}
                className={`p-2 md:p-3 rounded-lg border ${getStatusColor(
                  response.status,
                )}`}
              >
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <div className="flex items-center gap-1 md:gap-2">
                    {getStatusIcon(response.status)}
                    <span className="text-xs md:text-sm font-medium text-gray-700">
                      {response.type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {response.status === "done" ? "Done" : "In progress"}
                  </span>
                </div>

                {/* 세부 정보 */}
                {response.details.length > 0 && (
                  <div className="space-y-1">
                    {response.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            response.status === "done"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        <span className="text-xs text-gray-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {response.timestamp}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>응답을 기다리는 중...</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>세션을 시작해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
