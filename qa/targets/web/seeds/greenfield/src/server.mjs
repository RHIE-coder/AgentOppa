import { createServer as httpCreate } from "node:http";

// 그린필드: 거의 빈 진짜 web. 헬스체크 하나뿐 — 하네스가 여기에 phase·기능을 얹는다.
// createApp() = 소켓 없는 요청 핸들러 → 테스트가 listen() 없이 직접 부른다(어떤 샌드박스에서도).
export function createApp() {
  return (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  };
}

// createServer() = createApp() 핸들러를 실제 http 서버로 감싼다 (npm start 용).
export function createServer() {
  return httpCreate(createApp());
}
