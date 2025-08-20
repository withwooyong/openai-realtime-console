import { useState, useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import WebSpeechRecognition from "./WebSpeechRecognition";

export default function ConversationPanel({ events, isSessionActive }) {
  const [messages, setMessages] = useState([]);
  const [webSpeechEnabled, setWebSpeechEnabled] = useState(false);
  const [webSpeechLanguage, setWebSpeechLanguage] = useState("ko-KR");
  const [webSpeechTranscripts, setWebSpeechTranscripts] = useState([]);
  const [audioTranscriptions, setAudioTranscriptions] = useState(new Map()); // item_id -> transcript 매핑
  const scrollRef = useRef(null);

  // Start Session 버튼 클릭 시 events가 초기화되면 관련 상태들도 초기화
  useEffect(() => {
    if (events.length === 0) {
      console.log(
        "🔄 [DEBUG] ConversationPanel: Events cleared, resetting transcription data",
      );
      setAudioTranscriptions(new Map());
      setWebSpeechTranscripts([]);
    }
  }, [events.length]);

  // 이벤트에서 대화 메시지 추출
  useEffect(() => {
    if (!events || events.length === 0) {
      console.log("💬 [DEBUG] ConversationPanel: No events to process");
      return;
    }

    console.log(
      "💬 [DEBUG] ConversationPanel: Processing",
      events.length,
      "events",
    );

    // 먼저 오디오 transcription 이벤트를 처리하여 매핑 업데이트
    const newTranscriptions = new Map(audioTranscriptions);

    events.forEach((event) => {
      // 오디오 transcription 완료 이벤트 처리
      if (
        event.type === "conversation.item.input_audio_transcription.completed"
      ) {
        console.log("🎤 [DEBUG] Audio transcription completed:", {
          item_id: event.item_id,
          transcript: event.transcript,
          full_event: event,
        });

        if (event.item_id && event.transcript) {
          newTranscriptions.set(event.item_id, event.transcript);
        }
      }
    });

    // transcription 매핑 업데이트
    if (
      newTranscriptions.size !== audioTranscriptions.size ||
      Array.from(newTranscriptions.entries()).some(
        ([key, value]) => audioTranscriptions.get(key) !== value,
      )
    ) {
      setAudioTranscriptions(newTranscriptions);
    }

    const conversationMessages = [];

    events.forEach((event) => {
      // 사용자 메시지 처리
      if (
        event.type === "conversation.item.created" &&
        event.item &&
        event.item.role === "user"
      ) {
        console.log("👤 [DEBUG] ConversationPanel: User message found", {
          event_type: event.type,
          item_id: event.item.id,
          content_types: event.item.content?.map((c) => c.type) || [],
          content_details: event.item.content || [],
          full_event: event,
        });

        // transcript가 있는지 확인하고 content에 추가
        let enhancedContent = [...(event.item.content || [])];
        const transcript = newTranscriptions.get(event.item.id);

        if (transcript) {
          console.log("🎤 [DEBUG] Adding transcript to user message:", {
            item_id: event.item.id,
            transcript: transcript,
          });

          // audio content에 transcript 추가하거나 새로운 audio content 생성
          const audioContentIndex = enhancedContent.findIndex(
            (c) => c.type === "input_audio" || c.type === "audio",
          );

          if (audioContentIndex !== -1) {
            // 기존 audio content에 transcript 추가
            enhancedContent[audioContentIndex] = {
              ...enhancedContent[audioContentIndex],
              transcript: transcript,
            };
          } else {
            // 새로운 audio content 추가 (audio data가 없어도 transcript만으로)
            enhancedContent.push({
              type: "input_audio",
              transcript: transcript,
            });
          }
        }

        const message = {
          id: event.event_id || event.item.id,
          type: "user",
          content: enhancedContent,
          timestamp: event.timestamp || new Date().toLocaleTimeString(),
        };

        conversationMessages.push(message);
      }

      // AI 응답 처리
      if (event.type === "response.done" && event.response) {
        console.log("🤖 [DEBUG] ConversationPanel: AI response found", {
          event_type: event.type,
          response_id: event.response.id,
          output_types: event.response.output?.map((o) => o.type) || [],
          output_details: event.response.output || [],
          full_event: event,
        });

        // AI 응답의 상세 데이터 구조 분석
        const output = event.response.output || [];
        console.log("🤖 [DEBUG] AI Response output structure:", output);

        if (output.length > 0) {
          console.log("🤖 [DEBUG] AI Response output[0]:", output[0]);

          if (output[0].content && Array.isArray(output[0].content)) {
            console.log(
              "🤖 [DEBUG] AI Response output[0].content:",
              output[0].content,
            );

            if (output[0].content.length > 0) {
              console.log(
                "🤖 [DEBUG] AI Response output[0].content[0]:",
                output[0].content[0],
              );

              // transcript 추출 시도
              const firstContent = output[0].content[0];
              if (firstContent && firstContent.transcript) {
                console.log(
                  "🤖 [DEBUG] AI Response transcript found:",
                  firstContent.transcript,
                );
              }
            }
          }
        }

        const message = {
          id: event.event_id || event.response.id,
          type: "assistant",
          content: event.response.output || [],
          timestamp: event.timestamp || new Date().toLocaleTimeString(),
        };

        conversationMessages.push(message);
      }
    });

    // 시간순 정렬 (최신순)
    conversationMessages.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    console.log(
      "💬 [DEBUG] ConversationPanel: Extracted",
      conversationMessages.length,
      "messages",
    );
    console.log(
      "💬 [DEBUG] ConversationPanel: Final messages:",
      conversationMessages,
    );
    setMessages(conversationMessages);
  }, [events, audioTranscriptions]);

  // Web Speech API 결과 처리
  const handleWebSpeechTranscript = (result) => {
    console.log("🎤 [DEBUG] Web Speech 결과 수신:", result);

    if (result.isFinal) {
      // 최종 결과를 별도 배열에 저장 (품질 비교용)
      setWebSpeechTranscripts((prev) => [
        ...prev,
        {
          ...result,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now(),
        },
      ]);
    }
  };

  // 언어 감지 결과 처리
  const handleLanguageDetected = (language) => {
    console.log("🌍 [DEBUG] 언어 감지:", language);
    setWebSpeechLanguage(language);
  };

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-base md:text-lg font-semibold text-gray-800">
            Conversation
          </h3>

          {/* Web Speech API 토글 */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={webSpeechEnabled}
                onChange={(e) => setWebSpeechEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-600">Web Speech</span>
            </label>

            {webSpeechEnabled && (
              <select
                value={webSpeechLanguage}
                onChange={(e) => setWebSpeechLanguage(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="ko-KR">한국어</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
                <option value="zh-CN">中文</option>
                <option value="auto">자동감지</option>
              </select>
            )}
          </div>
        </div>

        {/* Web Speech Recognition - 모바일 최적화 */}
        {webSpeechEnabled && isSessionActive && (
          <div className="mt-2 md:mt-3 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-md">
            <WebSpeechRecognition
              onTranscript={handleWebSpeechTranscript}
              onLanguageDetected={handleLanguageDetected}
              language={webSpeechLanguage}
              continuous={true}
              interimResults={true}
            />
          </div>
        )}

        {/* Web Speech 결과 표시 */}
        {webSpeechTranscripts.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer">
                Web Speech 결과 ({webSpeechTranscripts.length}개)
              </summary>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {webSpeechTranscripts.slice(-5).map((transcript) => (
                  <div
                    key={transcript.id}
                    className="p-2 bg-white border border-gray-200 rounded text-xs"
                  >
                    <div className="font-medium">"{transcript.transcript}"</div>
                    <div className="text-gray-500 text-xs">
                      {transcript.timestamp} | 신뢰도:{" "}
                      {Math.round((transcript.confidence || 0) * 100)}% | 언어:{" "}
                      {transcript.language}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4"
      >
        {isSessionActive ? (
          messages.length > 0 ? (
            messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p>대화를 시작해보세요...</p>
                {webSpeechEnabled && (
                  <p className="text-xs mt-2 text-blue-600">
                    🎤 Web Speech API로 음성을 실시간 인식 중...
                  </p>
                )}
              </div>
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
