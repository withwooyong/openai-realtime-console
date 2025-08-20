import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import ConversationDashboard from "./conversation/ConversationDashboard";
import ErrorBoundary from "./ErrorBoundary";

export default function App() {
  // Console 탭용 상태
  const [consoleSessionActive, setConsoleSessionActive] = useState(false);
  const [consoleEvents, setConsoleEvents] = useState([]);
  const [consoleDataChannel, setConsoleDataChannel] = useState(null);
  const consolePeerConnection = useRef(null);
  const consoleAudioElement = useRef(null);

  // Conversation 탭용 상태
  const [conversationSessionActive, setConversationSessionActive] =
    useState(false);
  const [conversationEvents, setConversationEvents] = useState([]);
  const [conversationDataChannel, setConversationDataChannel] = useState(null);
  const conversationPeerConnection = useRef(null);
  const conversationAudioElement = useRef(null);

  const [viewMode, setViewMode] = useState("console"); // 'console' 또는 'conversation'

  // 뷰 모드 전환 추적
  const handleViewModeChange = (newMode) => {
    console.log("🔄 [DEBUG] View mode changing:", viewMode, "->", newMode);
    setViewMode(newMode);
  };

  // 뷰 모드 변화 추적
  useEffect(() => {
    console.log("🎛️ [DEBUG] View mode changed to:", viewMode);
  }, [viewMode]);

  // 전역 에러 핸들러 설정
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error("🚨 [ERROR] Global JavaScript error:", event.error);
      console.error("🚨 [ERROR] Error message:", event.message);
      console.error(
        "🚨 [ERROR] Error source:",
        event.filename + ":" + event.lineno + ":" + event.colno,
      );
    };

    const handleUnhandledRejection = (event) => {
      console.error("🚨 [ERROR] Unhandled Promise rejection:", event.reason);
      console.error("🚨 [ERROR] Promise:", event.promise);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // Console 세션 시작
  async function startConsoleSession() {
    try {
      console.log("🚀 [DEBUG] Starting Console session...");
      // 새 세션 시작 시 이벤트 초기화
      setConsoleEvents([]);
      const tokenUrl = "https://ai.yanadoo.co.kr/realtime/sessions";
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          modalities: ["audio", "text"],
          instructions: "You are a friendly assistant.",
          voice: "verse",
          input_audio_transcription: {
            model: "whisper-1", // 또는 "gpt-4o-transcribe", "gpt-4o-mini-transcribe"
          },
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const data = await tokenResponse.json();
      console.log("🎫 [DEBUG] Console token received");
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();

      consoleAudioElement.current = document.createElement("audio");
      consoleAudioElement.current.autoplay = true;
      pc.ontrack = (e) =>
        (consoleAudioElement.current.srcObject = e.streams[0]);

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      setConsoleDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      consolePeerConnection.current = pc;
      console.log("✅ [DEBUG] Console session setup completed");
    } catch (error) {
      console.error("❌ [ERROR] Console session startup failed:", error);
      // 세션 시작 실패 시 상태 복구
      setConsoleSessionActive(false);
      setConsoleDataChannel(null);
      if (consolePeerConnection.current) {
        consolePeerConnection.current.close();
        consolePeerConnection.current = null;
      }
    }
  }

  // Conversation 세션 시작
  async function startConversationSession() {
    try {
      console.log("🚀 [DEBUG] Starting Conversation session...");
      // 새 세션 시작 시 이벤트 초기화
      setConversationEvents([]);
      const tokenUrl = "https://ai.yanadoo.co.kr/realtime/sessions";
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          modalities: ["audio", "text"],
          instructions: "You are a friendly assistant.",
          voice: "verse",
          input_audio_transcription: {
            model: "whisper-1", // 또는 "gpt-4o-transcribe", "gpt-4o-mini-transcribe"
          },
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const data = await tokenResponse.json();
      console.log("🎫 [DEBUG] Conversation token received");
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();

      conversationAudioElement.current = document.createElement("audio");
      conversationAudioElement.current.autoplay = true;
      pc.ontrack = (e) =>
        (conversationAudioElement.current.srcObject = e.streams[0]);

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      setConversationDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      conversationPeerConnection.current = pc;
      console.log("✅ [DEBUG] Conversation session setup completed");
    } catch (error) {
      console.error("❌ [ERROR] Conversation session startup failed:", error);
      // 세션 시작 실패 시 상태 복구
      setConversationSessionActive(false);
      setConversationDataChannel(null);
      if (conversationPeerConnection.current) {
        conversationPeerConnection.current.close();
        conversationPeerConnection.current = null;
      }
    }
  }

  // Console 세션 종료
  function stopConsoleSession() {
    if (consoleDataChannel) {
      consoleDataChannel.close();
    }

    if (consolePeerConnection.current) {
      consolePeerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      consolePeerConnection.current.close();
    }

    setConsoleSessionActive(false);
    setConsoleDataChannel(null);
    consolePeerConnection.current = null;
  }

  // Conversation 세션 종료
  function stopConversationSession() {
    if (conversationDataChannel) {
      conversationDataChannel.close();
    }

    if (conversationPeerConnection.current) {
      conversationPeerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      conversationPeerConnection.current.close();
    }

    setConversationSessionActive(false);
    setConversationDataChannel(null);
    conversationPeerConnection.current = null;
  }

  // Console: Send a message to the model
  function sendConsoleClientEvent(message) {
    try {
      console.log("📤 [DEBUG] Console sending event:", message.type, message);

      if (consoleDataChannel) {
        const timestamp = new Date().toLocaleTimeString();
        message.event_id = message.event_id || crypto.randomUUID();

        consoleDataChannel.send(JSON.stringify(message));

        if (!message.timestamp) {
          message.timestamp = timestamp;
        }
        setConsoleEvents((prev) => [message, ...prev]);
        console.log("✅ [DEBUG] Console message sent successfully");
      } else {
        console.error(
          "❌ [ERROR] Failed to send console message - no data channel available",
          message,
        );
      }
    } catch (error) {
      console.error("❌ [ERROR] Console message send failed:", error, message);
    }
  }

  // Console: Send a text message to the model
  function sendConsoleTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendConsoleClientEvent(event);
    sendConsoleClientEvent({ type: "response.create" });
  }

  // Conversation: Send a message to the model
  function sendConversationClientEvent(message) {
    try {
      console.log(
        "📤 [DEBUG] Conversation sending event:",
        message.type,
        message,
      );

      if (conversationDataChannel) {
        const timestamp = new Date().toLocaleTimeString();
        message.event_id = message.event_id || crypto.randomUUID();

        conversationDataChannel.send(JSON.stringify(message));

        if (!message.timestamp) {
          message.timestamp = timestamp;
        }
        setConversationEvents((prev) => [message, ...prev]);
        console.log("✅ [DEBUG] Conversation message sent successfully");
      } else {
        console.error(
          "❌ [ERROR] Failed to send conversation message - no data channel available",
          message,
        );
      }
    } catch (error) {
      console.error(
        "❌ [ERROR] Conversation message send failed:",
        error,
        message,
      );
    }
  }

  // Conversation: Send a text message to the model
  function sendConversationTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendConversationClientEvent(event);
    sendConversationClientEvent({ type: "response.create" });
  }

  // Console: Attach event listeners to the data channel
  useEffect(() => {
    if (consoleDataChannel) {
      console.log("🔧 [DEBUG] Console DataChannel connected");

      const messageHandler = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("📨 [DEBUG] Console received event:", event.type, event);

          if (!event.timestamp) {
            event.timestamp = new Date().toLocaleTimeString();
          }
          setConsoleEvents((prev) => {
            console.log("📊 [DEBUG] Console events count:", prev.length + 1);
            return [event, ...prev];
          });
        } catch (error) {
          console.error(
            "❌ [ERROR] Console message parsing failed:",
            error,
            e.data,
          );
        }
      };

      const openHandler = () => {
        console.log("✅ [DEBUG] Console session opened");
        setConsoleSessionActive(true);
      };

      consoleDataChannel.addEventListener("message", messageHandler);
      consoleDataChannel.addEventListener("open", openHandler);

      return () => {
        console.log("🔌 [DEBUG] Console DataChannel cleanup");
        consoleDataChannel.removeEventListener("message", messageHandler);
        consoleDataChannel.removeEventListener("open", openHandler);
      };
    }
  }, [consoleDataChannel]);

  // Conversation: Attach event listeners to the data channel
  useEffect(() => {
    if (conversationDataChannel) {
      console.log("🎯 [DEBUG] Conversation DataChannel connected");

      const messageHandler = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log(
            "💬 [DEBUG] Conversation received event:",
            event.type,
            event,
          );

          // 특별히 AI 응답과 관련된 이벤트들 상세 로그
          if (
            event.type === "response.created" ||
            event.type === "response.done" ||
            event.type === "response.audio.delta" ||
            event.type === "conversation.item.created"
          ) {
            console.log("🤖 [DEBUG] AI Response Event:", {
              type: event.type,
              data: event,
              timestamp: new Date().toISOString(),
            });
          }

          if (!event.timestamp) {
            event.timestamp = new Date().toLocaleTimeString();
          }

          setConversationEvents((prev) => {
            console.log(
              "💬 [DEBUG] Conversation events count:",
              prev.length + 1,
            );
            console.log("💬 [DEBUG] Current view mode:", viewMode);
            return [event, ...prev];
          });
        } catch (error) {
          console.error(
            "❌ [ERROR] Conversation message parsing failed:",
            error,
            e.data,
          );
        }
      };

      const openHandler = () => {
        console.log("✅ [DEBUG] Conversation session opened");
        setConversationSessionActive(true);
      };

      conversationDataChannel.addEventListener("message", messageHandler);
      conversationDataChannel.addEventListener("open", openHandler);

      return () => {
        console.log("🔌 [DEBUG] Conversation DataChannel cleanup");
        conversationDataChannel.removeEventListener("message", messageHandler);
        conversationDataChannel.removeEventListener("open", openHandler);
      };
    }
  }, [conversationDataChannel]);

  return (
    <ErrorBoundary>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center justify-between w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <div className="flex items-center gap-4">
            <img style={{ width: "24px" }} src={logo} />
            <h1>realtime console</h1>
          </div>

          {/* 뷰 모드 전환 버튼 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange("console")}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === "console"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Console
            </button>
            <button
              onClick={() => handleViewModeChange("conversation")}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === "conversation"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Conversation
            </button>
          </div>
        </div>
      </nav>

      <main className="absolute top-16 left-0 right-0 bottom-0">
        {viewMode === "console" ? (
          // Console 탭 (독립적인 상태)
          <>
            <section className="absolute top-0 left-0 right-0 md:right-[380px] bottom-0 flex">
              <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
                <EventLog events={consoleEvents} />
              </section>
              <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
                <SessionControls
                  startSession={startConsoleSession}
                  stopSession={stopConsoleSession}
                  sendClientEvent={sendConsoleClientEvent}
                  sendTextMessage={sendConsoleTextMessage}
                  events={consoleEvents}
                  isSessionActive={consoleSessionActive}
                />
              </section>
            </section>
            <section className="hidden md:block absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
              <ToolPanel
                sendClientEvent={sendConsoleClientEvent}
                sendTextMessage={sendConsoleTextMessage}
                events={consoleEvents}
                isSessionActive={consoleSessionActive}
              />
            </section>
          </>
        ) : (
          // Conversation 탭 (독립적인 상태)
          <section className="absolute top-0 left-0 right-0 bottom-0 p-4">
            <ConversationDashboard
              events={conversationEvents}
              isSessionActive={conversationSessionActive}
              dataChannel={conversationDataChannel}
              startSession={startConversationSession}
              stopSession={stopConversationSession}
              sendClientEvent={sendConversationClientEvent}
              sendTextMessage={sendConversationTextMessage}
            />
          </section>
        )}
      </main>
    </ErrorBoundary>
  );
}
