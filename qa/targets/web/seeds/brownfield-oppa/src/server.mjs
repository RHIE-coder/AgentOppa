import { createServer as httpCreate } from "node:http";
import { newStore } from "./lib/store.mjs";
import { send } from "./lib/http.mjs";
import { signup, login } from "./routes/auth.mjs";
import { getProfile, updateProfile } from "./routes/profile.mjs";
import { listPosts, createPost, getPost, deletePost } from "./routes/board.mjs";

// createApp() = 소켓 없는 요청 핸들러. store 클로저(호출마다 새 store) = 테스트 격리.
//   소켓에 묶이지 않으므로 테스트가 listen() 없이 핸들러를 직접 부를 수 있다
//   — 어떤 샌드박스에서도(특히 codex workspace-write 의 listen() EPERM 회피).
export function createApp() {
  const store = newStore();
  return async (req, res) => {
    const { method } = req;
    const path = new URL(req.url, "http://localhost").pathname;
    try {
      if (method === "POST" && path === "/signup") return await signup(store, req, res);
      if (method === "POST" && path === "/login") return await login(store, req, res);
      if (method === "GET" && path === "/profile") return getProfile(store, req, res);
      if (method === "PUT" && path === "/profile") return await updateProfile(store, req, res);
      if (method === "GET" && path === "/posts") return listPosts(store, req, res);
      if (method === "POST" && path === "/posts") return await createPost(store, req, res);
      const m = path.match(/^\/posts\/([^/]+)$/);
      if (m && method === "GET") return getPost(store, req, res, m[1]);
      if (m && method === "DELETE") return deletePost(store, req, res, m[1]);
      send(res, 404, { error: "not found" });
    } catch {
      send(res, 500, { error: "internal" });
    }
  };
}

// createServer() = createApp() 핸들러를 실제 http 서버로 감싼다 (npm start 용 — 앱은 그대로 realistic).
export function createServer() {
  return httpCreate(createApp());
}
