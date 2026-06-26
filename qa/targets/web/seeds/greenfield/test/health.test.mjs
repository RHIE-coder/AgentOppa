import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.mjs";

// in-process: 소켓 없이 createApp() 핸들러를 직접 부른다(listen()·fetch 없음 → 어떤 샌드박스에서도).
test("GET /health → {ok:true}", async () => {
  const app = createApp();
  const res = await new Promise((resolve) => {
    let body = "";
    const mockRes = {
      statusCode: 200,
      writeHead(status) { this.statusCode = status; return this; },
      end(chunk) {
        if (chunk !== undefined) body += chunk;
        resolve({ status: this.statusCode, json: () => JSON.parse(body) });
      },
    };
    app({ method: "GET", url: "/health", headers: {} }, mockRes);
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json(), { ok: true });
});
