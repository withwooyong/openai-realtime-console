import { useEffect } from "react";
import AudioBufferPanel from "./AudioBufferPanel";
import ConversationPanel from "./ConversationPanel";
import ResponsePanel from "./ResponsePanel";
import SessionControls from "../SessionControls";

export default function ConversationDashboard({
  events,
  isSessionActive,
  dataChannel,
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
}) {
  // ConversationDashboard 상태 변화 추적
  useEffect(() => {
    console.log("🎯 [DEBUG] ConversationDashboard: Props updated", {
      eventsCount: events?.length || 0,
      isSessionActive,
      hasDataChannel: !!dataChannel,
    });
  }, [events, isSessionActive, dataChannel]);

  // 세션 상태 변화 추적
  useEffect(() => {
    console.log(
      "🎯 [DEBUG] ConversationDashboard: Session state changed:",
      isSessionActive,
    );
    if (isSessionActive) {
      console.log("✅ [DEBUG] ConversationDashboard: Session is now ACTIVE");
    } else {
      console.log("❌ [DEBUG] ConversationDashboard: Session is now INACTIVE");
    }
  }, [isSessionActive]);

  // 이벤트 개수 변화 추적
  useEffect(() => {
    if (events && events.length > 0) {
      console.log(
        "🎯 [DEBUG] ConversationDashboard: Events updated, count:",
        events.length,
      );
      console.log("🎯 [DEBUG] ConversationDashboard: Latest event:", events[0]);
    }
  }, [events]);
  return (
    <div className="h-full w-full bg-gray-50 rounded-lg flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
          Session
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${
              isSessionActive ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {isSessionActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto">
        {/* 모바일: 세로 배치 (Responses 숨김), PC: 가로 배치 (3개 패널) */}
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* Input Audio Buffer */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white min-h-[250px] lg:min-h-0">
            <AudioBufferPanel
              events={events}
              isSessionActive={isSessionActive}
              dataChannel={dataChannel}
            />
          </div>

          {/* Conversation - 모바일에서 더 큰 공간 할당 */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white min-h-[450px] lg:min-h-0 flex-1 lg:flex-initial">
            <ConversationPanel
              events={events}
              isSessionActive={isSessionActive}
            />
          </div>

          {/* Responses - PC에서만 표시 */}
          <div className="hidden lg:block lg:w-1/3 bg-white min-h-[300px] lg:min-h-0">
            <ResponsePanel events={events} isSessionActive={isSessionActive} />
          </div>
        </div>
      </div>

      {/* 하단 SessionControls - 항상 보이도록 고정 */}
      <div className="border-t border-gray-200 bg-white p-4 md:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <SessionControls
            startSession={startSession}
            stopSession={stopSession}
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </div>
      </div>
    </div>
  );
}
