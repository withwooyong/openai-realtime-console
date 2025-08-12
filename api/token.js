export default async function handler(req, res) {
  console.log("=== API 호출 시작 ===");
  console.log("요청 메서드:", req.method);
  console.log("요청 URL:", req.url);
  console.log("요청 헤더:", req.headers);
  console.log("환경 변수 확인:", {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.length
      : 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });

  try {
    // CORS 헤더 설정
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      console.log("OPTIONS 요청 처리");
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      console.log("잘못된 메서드:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("API 키 확인 중...");
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY가 설정되지 않음");
      return res.status(500).json({
        error: "API key not configured",
        env: process.env.NODE_ENV,
        hasKey: !!process.env.OPENAI_API_KEY,
      });
    }

    console.log("OpenAI API 호출 시작...");
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          voice: "verse",
        }),
      },
    );

    console.log("OpenAI API 응답 상태:", response.status);
    console.log(
      "OpenAI API 응답 헤더:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API 오류:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI API 응답 데이터:", data);
    console.log("=== API 호출 성공 ===");

    res.json(data);
  } catch (error) {
    console.error("=== API 호출 실패 ===");
    console.error("에러 타입:", error.constructor.name);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);

    res.status(500).json({
      error: "Failed to generate token",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
