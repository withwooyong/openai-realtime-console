export default async function handler(req, res) {
  console.log("=== 테스트 API 호출 ===");
  console.log("요청 메서드:", req.method);
  console.log("요청 URL:", req.url);
  console.log("환경 변수:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });

  res.json({
    message: "Test API working",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: process.env.NODE_ENV,
  });
}
