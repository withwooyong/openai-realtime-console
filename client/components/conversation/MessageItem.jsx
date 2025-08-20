import AudioWaveform from "./AudioWaveform";

// 임시로 아이콘을 대체할 간단한 컴포넌트들
const User = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    👤
  </div>
);

const Bot = ({ size, className }) => (
  <div
    className={`${className} flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    🤖
  </div>
);

export default function MessageItem({ message }) {
  const isUser = message.type === "user";

  // 메시지 내용을 디버깅과 함께 추출
  const extractMessageContent = (content, messageType) => {
    console.log(
      `💬 [DEBUG] MessageItem: Extracting content for ${messageType}:`,
      content,
    );

    if (!Array.isArray(content)) {
      console.log(
        `💬 [DEBUG] MessageItem: Content is not array for ${messageType}`,
      );
      return { text: "", transcript: "", hasAudio: false };
    }

    // 사용자 메시지 처리
    if (messageType === "User") {
      // 텍스트 콘텐츠 찾기
      const textContent = content.find(
        (c) => c.type === "input_text" || c.type === "text",
      );
      const text = textContent?.text || "";

      // 오디오 콘텐츠 찾기
      const audioContent = content.find(
        (c) => c.type === "input_audio" || c.type === "audio",
      );
      const transcript = audioContent?.transcript || "";
      const hasAudio = !!audioContent;

      console.log(`💬 [DEBUG] MessageItem: User content extracted:`, {
        text,
        transcript,
        hasAudio,
        audioContent: audioContent
          ? {
              type: audioContent.type,
              hasTranscript: !!audioContent.transcript,
            }
          : null,
      });

      return { text, transcript, hasAudio };
    }

    // AI 응답 처리 (Assistant)
    if (messageType === "Assistant") {
      let text = "";
      let transcript = "";
      let hasAudio = false;

      console.log(
        `🤖 [DEBUG] MessageItem: Processing AI response content:`,
        content,
      );

      // AI 응답의 경우 content[0].content[0].transcript 구조 확인
      if (content.length > 0 && content[0]) {
        console.log(`🤖 [DEBUG] MessageItem: AI content[0]:`, content[0]);

        // content[0]이 직접 transcript를 가지고 있는지 확인
        if (content[0].transcript) {
          transcript = content[0].transcript;
          console.log(
            `🤖 [DEBUG] MessageItem: AI transcript found at content[0].transcript:`,
            transcript,
          );
        }

        // content[0].content 배열이 있는지 확인
        if (
          content[0].content &&
          Array.isArray(content[0].content) &&
          content[0].content.length > 0
        ) {
          console.log(
            `🤖 [DEBUG] MessageItem: AI content[0].content:`,
            content[0].content,
          );

          const innerContent = content[0].content[0];
          if (innerContent && innerContent.transcript) {
            transcript = innerContent.transcript;
            console.log(
              `🤖 [DEBUG] MessageItem: AI transcript found at content[0].content[0].transcript:`,
              transcript,
            );
          }
        }

        // 오디오 타입 확인
        if (content[0].type === "audio" || content[0].type === "input_audio") {
          hasAudio = true;
        }
      }

      // 일반적인 텍스트 콘텐츠도 확인
      const textContent = content.find(
        (c) => c.type === "input_text" || c.type === "text",
      );
      if (textContent?.text) {
        text = textContent.text;
      }

      console.log(`🤖 [DEBUG] MessageItem: AI content final extracted:`, {
        text,
        transcript,
        hasAudio,
      });

      return { text, transcript, hasAudio };
    }

    // 기본 처리 (fallback)
    const textContent = content.find(
      (c) => c.type === "input_text" || c.type === "text",
    );
    const text = textContent?.text || "";

    const audioContent = content.find(
      (c) => c.type === "input_audio" || c.type === "audio",
    );
    const transcript = audioContent?.transcript || "";
    const hasAudio = !!audioContent;

    return { text, transcript, hasAudio };
  };

  // 메시지 내용 추출
  const messageContent = extractMessageContent(
    message.content,
    isUser ? "User" : "Assistant",
  );

  console.log(
    `💬 [DEBUG] MessageItem: Processing ${
      isUser ? "User" : "Assistant"
    } message:`,
    {
      messageId: message.id,
      timestamp: message.timestamp,
      contentArray: message.content,
      extracted: messageContent,
    },
  );

  return (
    <div
      className={`flex gap-2 md:gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* 아바타 (AI 메시지일 때만 왼쪽에) */}
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <Bot size={12} className="md:w-4 md:h-4 text-purple-600" />
        </div>
      )}

      {/* 메시지 내용 */}
      <div className={`max-w-[85%] md:max-w-[80%] ${isUser ? "order-2" : ""}`}>
        {/* 메시지 헤더 */}
        <div
          className={`flex items-center gap-1 md:gap-2 mb-1 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-xs font-medium text-gray-600">
            {isUser ? "User's message" : "Assistant's message"}
          </span>
          <span className="text-xs text-gray-400">Item</span>
        </div>

        {/* 메시지 박스 */}
        <div
          className={`p-2 md:p-3 rounded-lg ${
            isUser
              ? "bg-green-100 border border-green-200"
              : "bg-purple-100 border border-purple-200"
          }`}
        >
          {/* 오디오 웨이브폼 (오디오 콘텐츠가 있을 때) */}
          {messageContent.hasAudio && (
            <div className="mb-2">
              <AudioWaveform
                isUser={isUser}
                audioData={message.content.find(
                  (c) => c.type === "input_audio" || c.type === "audio",
                )}
              />
            </div>
          )}

          {/* 메시지 내용 표시 우선순위: transcript > 텍스트 */}
          {messageContent.transcript || messageContent.text ? (
            <div className="space-y-2">
              {/* 오디오 전사 내용 (음성 → 텍스트 변환) - 최우선 표시 */}
              {messageContent.transcript && (
                <div className="bg-white bg-opacity-50 rounded-md p-2 border border-dashed border-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">
                      🎤
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                        "{messageContent.transcript}"
                      </p>
                      <p className="text-xs text-blue-600 mt-1 opacity-75">
                        음성 인식 결과
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 텍스트 메시지 (직접 입력한 텍스트) - 부가적 표시 */}
              {messageContent.text && (
                <p className="text-sm text-gray-700">
                  💬 {messageContent.text}
                </p>
              )}
            </div>
          ) : (
            /* 콘텐츠가 없을 때 */
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 italic">
                {messageContent.hasAudio
                  ? "🎤 음성 처리 중..."
                  : "메시지 내용 없음"}
              </p>
              {messageContent.hasAudio && (
                <p className="text-xs text-blue-500 mt-1">
                  음성 인식 결과를 기다리는 중입니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 타임스탬프 */}
        <div
          className={`text-xs text-gray-400 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp}
        </div>
      </div>

      {/* 아바타 (사용자 메시지일 때만 오른쪽에) */}
      {isUser && (
        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center order-3">
          <User size={12} className="md:w-4 md:h-4 text-green-600" />
        </div>
      )}
    </div>
  );
}
