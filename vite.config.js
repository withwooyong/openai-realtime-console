import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const path = fileURLToPath(import.meta.url);

export default {
  root: join(dirname(path), "client"),
  plugins: [react()],
  build: {
    outDir: join(dirname(path), "dist", "client"), // 절대 경로 사용
    emptyOutDir: true, // 출력 디렉토리 비우기 허용
  },
};
