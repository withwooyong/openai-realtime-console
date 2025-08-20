import { useState, useEffect, useRef } from "react";

// 향상된 언어 감지 함수
const detectLanguageFromTranscript = (text) => {
  if (!text || text.trim().length < 2) return "정보 없음";

  const cleanText = text.trim().toLowerCase();
  let scores = { korean: 0, japanese: 0, chinese: 0, english: 0 };

  // 한국어 감지 (개선된 패턴)
  const koreanPatterns = [
    /[가-힣]/g, // 완성된 한글
    /[ㄱ-ㅎㅏ-ㅣ]/g, // 자음, 모음
    /(은|는|이|가|을|를|에|에서|와|과|의|도|만|부터|까지|에게|한테)/g, // 조사
    /(입니다|습니다|해요|어요|이에요|예요)/g, // 어미
    /(안녕|감사|죄송|미안|사랑)/g, // 한국어 특징 단어
  ];

  koreanPatterns.forEach((pattern) => {
    const matches = cleanText.match(pattern);
    if (matches) scores.korean += matches.length * 2;
  });

  // 일본어 감지 (개선된 패턴)
  const japanesePatterns = [
    /[ひらがな]/g, // 히라가나
    /[カタカナ]/g, // 카타카나
    /[一-龯]/g, // 한자 (일본어용)
    /(です|ます|した|って|という|ある|する|いる|なる)/g, // 일본어 특징 표현
    /(こんにち|ありがと|すみません|はじめまして)/g, // 일본어 인사말
  ];

  japanesePatterns.forEach((pattern) => {
    const matches = cleanText.match(pattern);
    if (matches) scores.japanese += matches.length * 2;
  });

  // 중국어 감지 (개선된 패턴)
  const chinesePatterns = [
    /[\u4e00-\u9fff]/g, // 중국어 한자
    /(你好|谢谢|对不起|再见|请问|没关系|不客气)/g, // 중국어 인사말
    /(的|了|是|在|有|和|也|都|会|要|可以)/g, // 중국어 특징 단어
    /(什么|怎么|哪里|为什么|多少)/g, // 의문사
  ];

  chinesePatterns.forEach((pattern) => {
    const matches = cleanText.match(pattern);
    if (matches) scores.chinese += matches.length * 2;
  });

  // 영어 감지 (개선된 패턴)
  const englishPatterns = [
    /\b[a-z]+\b/g, // 영문 단어
    /\b(the|is|are|and|or|but|in|on|at|to|for|of|with|by)\b/g, // 관사/전치사
    /\b(hello|thank|sorry|please|welcome|good|nice|how|what|where|when|why)\b/g, // 영어 인사말/의문사
    /\b(going|doing|being|having|getting|making|taking|coming)\b/g, // 진행형/동명사
  ];

  englishPatterns.forEach((pattern) => {
    const matches = cleanText.match(pattern);
    if (matches) scores.english += matches.length;
  });

  // 점수 기반 언어 판정
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "정보 없음";

  // 신뢰도 계산 (최고점수 / 총점수)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.round((maxScore / totalScore) * 100);

  // 가장 높은 점수의 언어 반환
  for (const [lang, score] of Object.entries(scores)) {
    if (score === maxScore) {
      const langCodes = {
        korean: `ko-KR (${confidence}%)`,
        japanese: `ja-JP (${confidence}%)`,
        chinese: `zh-CN (${confidence}%)`,
        english: `en-US (${confidence}%)`,
      };

      console.log(
        `🎯 [DEBUG] 언어 점수: 한국어=${scores.korean}, 일본어=${scores.japanese}, 중국어=${scores.chinese}, 영어=${scores.english}`,
      );
      return langCodes[lang];
    }
  }

  return "정보 없음";
};

// 품질 점수 계산 함수
const calculateQualityScore = (responseTime, confidence, textLength) => {
  let score = 100;

  // 응답 시간 평가 (빠를수록 좋음)
  if (responseTime > 2000) score -= 30;
  else if (responseTime > 1000) score -= 15;
  else if (responseTime > 500) score -= 5;

  // 신뢰도 평가
  if (confidence) {
    if (confidence < 0.5) score -= 40;
    else if (confidence < 0.7) score -= 20;
    else if (confidence < 0.9) score -= 5;
  } else {
    score -= 20; // 신뢰도 정보 없음
  }

  // 텍스트 길이 평가 (너무 짧으면 인식 품질 의심)
  if (textLength < 3) score -= 20;
  else if (textLength < 6) score -= 10;

  return Math.max(0, Math.round(score));
};

const WebSpeechRecognition = ({
  onTranscript,
  onLanguageDetected,
  language = "ko-KR",
  continuous = true,
  interimResults = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [error, setError] = useState("");
  const [qualityScore, setQualityScore] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const recognitionRef = useRef(null);

  // 브라우저 지원 확인
  useEffect(() => {
    const supported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setIsSupported(supported);

    if (supported) {
      console.log("🎤 [DEBUG] Web Speech API 지원됨");
    } else {
      console.log("❌ [DEBUG] Web Speech API 미지원");
    }
  }, []);

  // 음성 인식 초기화
  const initRecognition = () => {
    if (!isSupported) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // 기본 설정
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 3;

    // 언어 설정 (auto가 아닌 경우에만)
    if (language !== "auto") {
      recognition.lang = language;
    }

    // 이벤트 핸들러
    recognition.onstart = () => {
      setIsListening(true);
      setError("");
      setStartTime(Date.now());
      console.log("🎤 [DEBUG] Web Speech 인식 시작");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const resultConfidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, resultConfidence);

          console.log("🎤 [DEBUG] Web Speech 최종 결과:", {
            transcript,
            confidence: resultConfidence,
            language: recognition.lang || "auto",
          });

          // 부모 컴포넌트에 결과 전달
          if (onTranscript) {
            onTranscript({
              transcript: transcript.trim(),
              confidence: resultConfidence,
              isFinal: true,
              language: recognition.lang || detectedLanguage,
              source: "WebSpeech",
            });
          }

          // 언어 감지 정보 전달
          if (onLanguageDetected && recognition.lang) {
            onLanguageDetected(recognition.lang);
            setDetectedLanguage(recognition.lang);
          }
        } else {
          interimTranscript += transcript;
        }
      }

      // UI 업데이트
      const displayTranscript = finalTranscript || interimTranscript;
      setCurrentTranscript(displayTranscript);
      setConfidence(maxConfidence);

      // 실시간 결과도 부모에게 전달 (옵션)
      if (interimResults && interimTranscript && onTranscript) {
        onTranscript({
          transcript: interimTranscript.trim(),
          confidence: 0,
          isFinal: false,
          language: recognition.lang || detectedLanguage,
          source: "WebSpeech",
        });
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = `음성 인식 오류: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);

      console.error("❌ [ERROR] Web Speech 오류:", event.error, event.message);

      // 특정 오류에 대한 자동 복구 시도
      if (event.error === "network") {
        console.log("🔄 [DEBUG] 네트워크 오류 - 5초 후 재시도");
        setTimeout(() => {
          if (recognitionRef.current) {
            startListening();
          }
        }, 5000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("🎤 [DEBUG] Web Speech 인식 종료");

      // continuous가 true인 경우 자동 재시작 (사용자가 명시적으로 정지하지 않은 경우)
      if (continuous && recognitionRef.current && !error) {
        console.log("🔄 [DEBUG] 연속 모드 - 자동 재시작");
        setTimeout(() => {
          if (recognitionRef.current && isSupported) {
            recognition.start();
          }
        }, 100);
      }
    };

    return recognition;
  };

  // 듣기 시작
  const startListening = () => {
    if (!isSupported) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = initRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        console.log("🎤 [DEBUG] Web Speech 시작 - 언어:", language);
      } catch (error) {
        console.error("❌ [ERROR] Web Speech 시작 실패:", error);
        setError("음성 인식을 시작할 수 없습니다.");
      }
    }
  };

  // 듣기 정지
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setCurrentTranscript("");
    setError("");
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 언어 변경 시 재시작
  useEffect(() => {
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 100);
    }
  }, [language]);

  return (
    <div className="web-speech-recognition">
      {/* 지원 상태 */}
      {!isSupported && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3">
          ❌ 이 브라우저는 Web Speech API를 지원하지 않습니다.
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3">
          {error}
        </div>
      )}

      {/* 컨트롤 버튼들 - 모바일 최적화 */}
      <div className="flex gap-2 mb-2 md:mb-3">
        <button
          onClick={startListening}
          disabled={!isSupported || isListening}
          className={`px-3 md:px-4 py-2 rounded-md text-white font-medium text-sm md:text-base flex-1 md:flex-initial transition-colors ${
            isListening
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 active:bg-green-700"
          }`}
        >
          {isListening ? "🎤 듣는 중..." : "🎤 시작"}
        </button>

        <button
          onClick={stopListening}
          disabled={!isSupported || !isListening}
          className={`px-3 md:px-4 py-2 rounded-md text-white font-medium text-sm md:text-base flex-1 md:flex-initial transition-colors ${
            !isListening
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 active:bg-red-700"
          }`}
        >
          ⏹️ 정지
        </button>
      </div>

      {/* 상태 표시 - 모바일 최적화 */}
      <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
        <div
          className={`flex items-center gap-2 ${
            isListening ? "text-green-600" : "text-gray-500"
          }`}
        >
          <div
            className={`w-2.5 md:w-3 h-2.5 md:h-3 rounded-full ${
              isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="font-medium">
            {isListening ? "🎤 듣는 중" : "⏸️ 대기 중"}
          </span>
        </div>

        {language && (
          <div className="text-gray-600 flex items-center gap-1">
            <span>🌍</span>
            <span>
              언어: {language}{" "}
              {detectedLanguage &&
                detectedLanguage !== language &&
                `(감지: ${detectedLanguage})`}
            </span>
          </div>
        )}

        {confidence > 0 && (
          <div className="text-gray-600 flex items-center gap-1">
            <span>📊</span>
            <span>신뢰도: {Math.round(confidence * 100)}%</span>
          </div>
        )}

        {qualityScore > 0 && (
          <div className="text-gray-600 flex items-center gap-1">
            <span>⭐</span>
            <span>품질: {qualityScore}/100</span>
          </div>
        )}
      </div>

      {/* 현재 인식 결과 미리보기 - 모바일 최적화 */}
      {currentTranscript && (
        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
            <span>💬</span>
            <span>실시간 인식 결과:</span>
          </div>
          <div className="text-blue-800 font-medium text-sm md:text-base leading-relaxed">
            "{currentTranscript}"
          </div>
        </div>
      )}

      {/* 디버그 정보 */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          <div>지원: {isSupported ? "✅" : "❌"}</div>
          <div>듣는 중: {isListening ? "✅" : "❌"}</div>
          <div>연속 모드: {continuous ? "✅" : "❌"}</div>
          <div>실시간 결과: {interimResults ? "✅" : "❌"}</div>
        </div>
      )}
    </div>
  );
};

export default WebSpeechRecognition;
