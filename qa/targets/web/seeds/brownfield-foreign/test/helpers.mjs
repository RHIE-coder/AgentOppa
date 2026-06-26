import { EventEmitter } from "node:events";
import { createApp } from "../src/server.mjs";

// in-process 테스트 클라이언트 — 소켓 없이 createApp() 핸들러를 직접 부른다.
//   listen()·fetch 없음 → 어떤 샌드박스에서도 동작(codex workspace-write 의 listen() EPERM 회피).
//   api(path,opts) 의 반환은 fetch Response 흉내({ status, json() }) — 기존 테스트 파일 그대로 통과.
export async function withServer(fn) {
  const app = createApp();
  const api = (path, opts = {}) =>
    new Promise((resolve, reject) => {
      // mock req: EventEmitter(핸들러의 readJson 이 .on("data"/"end") 을 건다).
      const req = new EventEmitter();
      req.method = opts.method ?? "GET";
      req.url = path;
      req.headers = { "content-type": "application/json", ...(opts.headers ?? {}) };
      // mock res: writeHead/end 캡처 → fetch Response 흉내로 resolve.
      const res = {
        statusCode: 200,
        _body: "",
        writeHead(status) {
          this.statusCode = status;
          return this;
        },
        end(chunk) {
          if (chunk !== undefined && chunk !== "") this._body += chunk;
          resolve({
            status: this.statusCode,
            async json() {
              return res._body ? JSON.parse(res._body) : undefined;
            },
            async text() {
              return res._body;
            },
          });
        },
      };
      // body 는 핸들러가 .on 을 건 *다음* 틱에 흘린다(readJson 이 await 후 리스너 등록하므로).
      //   GET 등 본문 없는 요청도 동일 경로 — 리스너가 없으면 무해.
      const payload = opts.body !== undefined ? JSON.stringify(opts.body) : "";
      setImmediate(() => {
        if (payload) req.emit("data", payload);
        req.emit("end");
      });
      Promise.resolve(app(req, res)).catch(reject);
    });
  await fn(api);
}

export async function tokenFor(api, username) {
  await api("/signup", { method: "POST", body: { username, password: "pw" } });
  const r = await api("/login", { method: "POST", body: { username, password: "pw" } });
  return (await r.json()).token;
}
