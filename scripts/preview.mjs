import http from "node:http";
import { readFile } from "node:fs/promises";
let source = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
  worker = (await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"))).default;
const store = new Map(),
  env = {
    BUCKET: {
      async get(k) {
        let s = store.get(k);
        return s === undefined ? null : { text: async () => s };
      },
      async put(k, s) {
        store.set(k, s);
      },
      async list({ prefix }) {
        return {
          objects: [...store.keys()]
            .filter((k) => k.startsWith(prefix))
            .sort()
            .map((key) => ({ key })),
          truncated: false,
        };
      },
    },
  };
await worker.fetch(
  new Request("http://127.0.0.1:4173/api/coach/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }),
  env,
);
http
  .createServer(async (req, res) => {
    try {
      let chunks = [];
      for await (const c of req) chunks.push(c);
      let r = await worker.fetch(
        new Request("http://" + (req.headers.host || "127.0.0.1:4173") + req.url, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
        }),
        env,
      );
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      res.writeHead(500);
      res.end(e.message);
    }
  })
  .listen(4173, "0.0.0.0", () => console.log("Local: http://127.0.0.1:4173"));
